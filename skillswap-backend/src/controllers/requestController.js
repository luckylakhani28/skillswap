const SwapRequest = require('../models/SwapRequest');
const Skill = require('../models/Skill');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

const populateRequest = (query) =>
  query
    .populate('fromUser', 'name username profilePicture')
    .populate('toUser', 'name username profilePicture')
    .populate('offeredSkill', 'skillName category')
    .populate('requestedSkill', 'skillName category');

// @route POST /api/requests
const createRequest = asyncHandler(async (req, res) => {
  const { offeredSkill, requestedSkill, message } = req.body;

  const [offered, requested] = await Promise.all([
    Skill.findById(offeredSkill),
    Skill.findById(requestedSkill),
  ]);
  if (!offered || !requested) throw new ApiError(404, 'One or both skills were not found');

  if (offered.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'The offered skill must be one you own');
  }
  if (requested.user.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot request your own skill');
  }

  // Prevent duplicate pending requests for the same pairing.
  const dupe = await SwapRequest.findOne({
    fromUser: req.user._id,
    requestedSkill,
    status: 'pending',
  });
  if (dupe) throw new ApiError(409, 'You already have a pending request for this skill');

  const request = await SwapRequest.create({
    fromUser: req.user._id,
    toUser: requested.user,
    offeredSkill,
    requestedSkill,
    message,
  });

  await notify({
    user: requested.user,
    type: 'request_received',
    message: `${req.user.name} wants to swap skills with you`,
    link: '/requests',
    meta: { requestId: request._id },
  });

  res.status(201).json({ success: true, request });
});

// @route GET /api/requests/incoming
const getIncoming = asyncHandler(async (req, res) => {
  const requests = await populateRequest(
    SwapRequest.find({ toUser: req.user._id }).sort({ createdAt: -1 })
  );
  res.json({ success: true, count: requests.length, requests });
});

// @route GET /api/requests/outgoing
const getOutgoing = asyncHandler(async (req, res) => {
  const requests = await populateRequest(
    SwapRequest.find({ fromUser: req.user._id }).sort({ createdAt: -1 })
  );
  res.json({ success: true, count: requests.length, requests });
});

// @route GET /api/requests/:id
const getRequestById = asyncHandler(async (req, res) => {
  const request = await populateRequest(SwapRequest.findById(req.params.id));
  if (!request) throw new ApiError(404, 'Request not found');

  const uid = req.user._id.toString();
  if (request.fromUser._id.toString() !== uid && request.toUser._id.toString() !== uid) {
    throw new ApiError(403, 'Not authorized to view this request');
  }
  res.json({ success: true, request });
});

/**
 * Load a request and assert the current user plays `role`
 * ('from' or 'to') and the current status is allowed.
 */
const loadForTransition = async (id, user, role, allowedStatuses) => {
  const request = await SwapRequest.findById(id);
  if (!request) throw new ApiError(404, 'Request not found');

  const actor = role === 'to' ? request.toUser : request.fromUser;
  if (actor.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Not authorized for this action');
  }
  if (!allowedStatuses.includes(request.status)) {
    throw new ApiError(400, `Cannot perform this action on a ${request.status} request`);
  }
  return request;
};

// @route PUT /api/requests/:id/accept  (recipient only)
const acceptRequest = asyncHandler(async (req, res) => {
  const request = await loadForTransition(req.params.id, req.user, 'to', ['pending']);
  request.status = 'accepted';
  await request.save();

  await notify({
    user: request.fromUser,
    type: 'request_accepted',
    message: `${req.user.name} accepted your swap request`,
    link: '/requests',
    meta: { requestId: request._id },
  });
  res.json({ success: true, request });
});

// @route PUT /api/requests/:id/reject  (recipient only)
const rejectRequest = asyncHandler(async (req, res) => {
  const request = await loadForTransition(req.params.id, req.user, 'to', ['pending']);
  request.status = 'rejected';
  await request.save();

  await notify({
    user: request.fromUser,
    type: 'request_rejected',
    message: `${req.user.name} declined your swap request`,
    link: '/requests',
    meta: { requestId: request._id },
  });
  res.json({ success: true, request });
});

// @route PUT /api/requests/:id/cancel  (requester only)
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await loadForTransition(req.params.id, req.user, 'from', ['pending', 'accepted']);
  request.status = 'cancelled';
  await request.save();

  await notify({
    user: request.toUser,
    type: 'request_cancelled',
    message: `${req.user.name} cancelled a swap request`,
    link: '/requests',
    meta: { requestId: request._id },
  });
  res.json({ success: true, request });
});

// @route PUT /api/requests/:id/complete  (either party, once accepted)
const completeRequest = asyncHandler(async (req, res) => {
  const request = await SwapRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found');

  const uid = req.user._id.toString();
  if (request.fromUser.toString() !== uid && request.toUser.toString() !== uid) {
    throw new ApiError(403, 'Not authorized for this action');
  }
  if (request.status !== 'accepted') {
    throw new ApiError(400, 'Only accepted requests can be completed');
  }

  request.status = 'completed';
  request.completedAt = new Date();
  await request.save();

  const otherParty = request.fromUser.toString() === uid ? request.toUser : request.fromUser;
  await notify({
    user: otherParty,
    type: 'swap_completed',
    message: `${req.user.name} marked your swap as completed. Leave a review!`,
    link: '/requests',
    meta: { requestId: request._id },
  });
  res.json({ success: true, request });
});

module.exports = {
  createRequest,
  getIncoming,
  getOutgoing,
  getRequestById,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
};
