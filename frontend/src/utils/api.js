// src/utils/api.js

import axios from "axios";

// Fetch all feeds
export const fetchFeeds = async () => {
  const res = await axios.get("/api/feeds");
  return res.data;
};

// Delete a single feed
export const deleteFeed = async (uuid) => {
  return axios.delete(`/api/feeds/${uuid}`);
};

// Delete all feeds
export const deleteAllFeeds = async () => {
  return axios.delete("/api/feeds");
};

// Get server stats
export const fetchStats = async () => {
  const res = await axios.get("/api/stats");
  return res.data;
};
