const prisma = require('../config/prisma');
const generateHash = require('../utils/imageHash');
const { classifyIssue } = require('../utils/aiClassifier');
const { getIO, onlineUsers } = require('../../socket');

// CREATE ISSUE
const stringSimilarity = require('string-similarity');

const createIssue = async (req, res) => {
  try {
    const { title, description, latitude, longitude } = req.body;

    const imageUrl = req.file ? req.file.path : null;

    let newImageHash = null;

    // 1. Generate hash for new image
    if (imageUrl) {
      newImageHash = await generateHash(imageUrl);
    }

    // 2. Classify the issue
    let category = 'OTHER';
    try {
      category = await classifyIssue(title, description, imageUrl);
    } catch (error) {
      console.log('Classification failed, using OTHER:', error.message);
    }

    // 3. Get all existing issues
    const existingIssues = await prisma.issue.findMany();

    for (let issue of existingIssues) {

      // 🔹 TEXT SIMILARITY
      const textSimilarity = stringSimilarity.compareTwoStrings(
        description.toLowerCase(),
        issue.description.toLowerCase()
      );

      // 🔹 IMAGE SIMILARITY
      let imageSimilar = false;

      if (newImageHash && issue.imageHash) {
        let diff = 0;

        for (let i = 0; i < newImageHash.length; i++) {
          if (newImageHash[i] !== issue.imageHash[i]) diff++;
        }

        const similarity = 1 - diff / newImageHash.length;

        if (similarity > 0.7) {
          imageSimilar = true;
        }
      }

      // 🔥 FINAL DECISION
      if (textSimilarity > 0.7 || imageSimilar) {
        return res.status(200).json({
          message: 'Duplicate issue detected',
          existingIssue: issue
        });
      }
    }

    // 4. Create issue
    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl,
        imageHash: newImageHash,
        category,
        userId: req.user.userId
      }
    });

    res.status(201).json({
      message: 'Issue created successfully',
      issue: newIssue
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL ISSUES (PUBLIC VIEW - with limited details)
const getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { upvotes: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// GET ALL ISSUES (ADMIN VIEW - with more details)
const getAllIssuesAdmin = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      sort = "desc",
      lat,
      lng,
      radius = 5
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    let where = {
      ...(status && { status }),

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            description: {
              contains: search,
              mode: "insensitive"
            }
          }
        ]
      })
    };

    // 🔥 STEP 1: Bounding Box Optimization
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      const latDiff = radiusKm / 111;
      const lngDiff =
        radiusKm / (111 * Math.cos((latNum * Math.PI) / 180));

      where = {
        ...where,
        latitude: {
          gte: latNum - latDiff,
          lte: latNum + latDiff
        },
        longitude: {
          gte: lngNum - lngDiff,
          lte: lngNum + lngDiff
        }
      };
    }

    // 📦 Fetch filtered issues
    let issues = await prisma.issue.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: { upvotes: true }
        }
      },
      orderBy: {
        createdAt: sort === "asc" ? "asc" : "desc"
      }
    });

    // 🌍 Haversine formula
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // 🔥 STEP 2: Precise geo filtering + distance + sorting
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      issues = issues
        .map(issue => {
          const distance = getDistance(
            latNum,
            lngNum,
            issue.latitude,
            issue.longitude
          );

          return {
            ...issue,
            distance: parseFloat(distance.toFixed(2))
          };
        })
        .filter(issue => issue.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
    }

    // 📊 Pagination AFTER filtering
    const total = issues.length;

    const paginatedIssues = issues.slice(
      (pageNumber - 1) * pageSize,
      pageNumber * pageSize
    );

    res.json({
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      issues: paginatedIssues
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// UPDATE ISSUE STATUS
const updateIssueStatus = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const { status } = req.body;

    // ✅ Validate status
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status value'
      });
    }

    // ✅ Check if issue exists
    const existing = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // ✅ Prevent same status update
    if (existing.status === status) {
      return res.status(400).json({
        message: `Issue is already ${status}`
      });
    }

    // ✅ Update status
    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { status }
    });

    res.json({
      message: 'Status updated successfully',
      issue: updatedIssue
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// DELETE ISSUE (ADMIN ONLY)
const deleteIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);

    // check if exists
    const existing = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existing) {
      return res.status(404).json({
        message: "Issue not found"
      });
    }

    // ✅ DELETE RELATED DATA FIRST
    await prisma.comment.deleteMany({
      where: { issueId }
    });

    await prisma.upvote.deleteMany({
      where: { issueId }
    });

    // ✅ NOW DELETE ISSUE
    await prisma.issue.delete({
      where: { id: issueId }
    });

    res.json({
      message: "Issue deleted successfully"
    });

  } catch (error) {
    console.log(error); // 👈 IMPORTANT (to see real error)
    res.status(500).json({ error: error.message });
  }
};


// GET ADMIN DASHBOARD STATS
const getAdminStats = async (req, res) => {
  try {
    const total = await prisma.issue.count();

    const pending = await prisma.issue.count({
      where: { status: "PENDING" }
    });

    const inProgress = await prisma.issue.count({
      where: { status: "IN_PROGRESS" }
    });

    const resolved = await prisma.issue.count({
      where: { status: "RESOLVED" }
    });

    const rejected = await prisma.issue.count({
      where: { status: "REJECTED" }
    });

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      rejected
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPVOTE ISSUE
const upvoteIssue = async (req, res) => {
  try {
    const userId = req.user.userId;
    const issueId = parseInt(req.params.id);

    // ✅ Check if already upvoted
    const existing = await prisma.upvote.findUnique({
      where: {
        userId_issueId: {
          userId,
          issueId
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        message: 'Already upvoted'
      });
    }

    // ✅ Create upvote
    await prisma.upvote.create({
      data: {
        userId,
        issueId
      }
    });

    // ✅ Get issue owner
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found"
      });
    }

    // 🔥 Notify issue owner (avoid self-notification)
    if (issue.userId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          message: `${req.user.name} Upvoted on your issue`,
          userId: issue.userId
        }
      });

      // ⚡ Real-time notification
      const io = getIO();
      if (onlineUsers[issue.userId]) {
        io.to(onlineUsers[issue.userId]).emit('notification', notification);
      }
    }

    res.json({
      message: 'Upvoted successfully'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ADD COMMENT TO ISSUE
const addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const issueId = parseInt(req.params.id);
    const { content } = req.body;

    // ✅ Check issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found"
      });
    }

    // ✅ Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        issueId
      }
    });

    // 🔥 Notify issue owner (avoid self-notification)
    if (issue.userId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          message: `${req.user.name} commented on your issue`,
          userId: issue.userId
        }
      });

      // ⚡ Real-time notification
      const io = getIO();
      if (onlineUsers[issue.userId]) {
        io.to(onlineUsers[issue.userId]).emit('notification', notification);
      }
    }

    res.json({
      message: "Comment added",
      comment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// GET COMMENTS FOR ISSUE
const getCommentsByIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);

    const comments = await prisma.comment.findMany({
      where: { issueId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(comments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE COMMENT
const deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const commentId = parseInt(req.params.id);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // ✅ Owner OR Admin can delete
    if (comment.userId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({
      message: "Comment deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET NOTIFICATIONS FOR USER
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(notifications);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// MARK NOTIFICATION AS READ
const markNotificationRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(notification);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Profile view
const getMyProfile = async (req, res) => {
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      issues: true,
      upvotes: {
        include: {
          issue: true
        }
      }
    }
  });

  res.json(user);
};


module.exports = {
  createIssue,
  getAllIssues,
  upvoteIssue,
  getAllIssuesAdmin,
  updateIssueStatus,
  deleteIssue,
  getAdminStats,
  addComment,
  getCommentsByIssue,
  deleteComment,
  getNotifications,
  markNotificationRead,
  getMyProfile
};
