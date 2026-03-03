/*
AIDDE TRACE HEADER
File: userRole.service.js
Feature: User role-based access control utility
Why: Enforce admin/user permissions for APIs
*/
const roles = {
  'admin-user-id': 'admin',
  // Add more userId: role pairs as needed
};

function getUserRole(userId) {
  return roles[userId] || 'user';
}

module.exports = { getUserRole };
