import React, { useState } from "react";
import Textarea from "../../../../components/ui/forms/textarea";
import Textfield from "../../../../components/ui/forms/input";
import { useMutation } from "@tanstack/react-query";
import {
  postTweetToX,
  triggerTelcoRepost,
  initiateXAuth,
  getRandomContent,
} from "../../../api";
import { toast } from "react-toastify";

const XPost = () => {
  const [postText, setPostText] = useState("");
  const [randomContent, setRandomContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const postTweetMutation = useMutation({
    mutationFn: postTweetToX,
    onSuccess: () => {
      toast.success("Tweet posted successfully!");
      setPostText("");
    },
    onError: (error) => {
      toast.error(
        `Error posting tweet: ${
          error.message || "An unexpected error occurred."
        }`
      );
    },
  });

  const triggerRepostMutation = useMutation({
    mutationFn: triggerTelcoRepost,
    onSuccess: () => {
      toast.success("Manual repost check triggered.");
    },
    onError: (error) => {
      toast.error(
        `Error triggering repost: ${
          error.message || "An unexpected error occurred."
        }`
      );
    },
  });

  const fetchRandomContentMutation = useMutation({
    mutationFn: getRandomContent,
    onSuccess: (data) => {
      setRandomContent(data.content);
      setIsModalOpen(true);
    },
    onError: (error) => {
      toast.error(
        `Error fetching random content: ${
          error.message || "An unexpected error occurred."
        }`
      );
    },
  });

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim()) {
      toast.info("Please enter text for your post.");
      return;
    }
    postTweetMutation.mutate(postText);
  };

  const handleTriggerRepost = () => {
    triggerRepostMutation.mutate();
  };

  const handleInitiateAuth = () => {
    initiateXAuth();
    toast.info("Redirecting to X for authentication...");
  };

  const handleFetchRandomContent = () => {
    fetchRandomContentMutation.mutate();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRandomContent("");
  };

  const handleCopyContent = () => {
    navigator.clipboard
      .writeText(randomContent)
      .then(() => {
        toast.success("Content copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Failed to copy content.");
        console.error("Copy failed:", err);
      });
  };

  return (
    <div className="border border-gray-200 rounded-md p-5 w-full max-w-6xl mx-auto shadow-lg bg-white">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        X API Dashboard
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <h3 className="text-xl font-semibold mb-3 text-gray-700">X Account Connection</h3>
          <p className="text-sm text-gray-600 mb-4">
            Authorize your X account to enable posting and automatic reposting features.
          </p>
          <button
            onClick={handleInitiateAuth}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={postTweetMutation.isLoading || triggerRepostMutation.isLoading || fetchRandomContentMutation.isLoading}
          >
            {postTweetMutation.isLoading || triggerRepostMutation.isLoading || fetchRandomContentMutation.isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : null}
            Connect X
          </button>
        </div>
  
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <h3 className="text-xl font-semibold mb-3 text-gray-700">Repost Telco Posts</h3>
          <p className="text-sm text-gray-600 mb-4">
            Automatically repost the latest posts from official accounts.
          </p>
          <button
            type="button"
            onClick={handleTriggerRepost}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={triggerRepostMutation.isLoading || postTweetMutation.isLoading || fetchRandomContentMutation.isLoading}
          >
            {triggerRepostMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Checking...
              </>
            ) : "Repost Check"}
          </button>
        </div>
  
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <h3 className="text-xl font-semibold mb-3 text-gray-700">Fetch Random Content</h3>
          <button
            type="button"
            onClick={handleFetchRandomContent}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={fetchRandomContentMutation.isLoading || postTweetMutation.isLoading || triggerRepostMutation.isLoading}
          >
            {fetchRandomContentMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Fetching...
              </>
            ) : "Get Random Content"}
          </button>
        </div>
      </div>
  
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">
          Create a New Post on Your X Account
        </h3>
        <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
          <Textarea
            label="Post Content"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="What's happening on X? (Max 280 characters)"
            rows={4}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={postTweetMutation.isLoading || !postText.trim() || triggerRepostMutation.isLoading || fetchRandomContentMutation.isLoading}
          >
            {postTweetMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Posting...
              </>
            ) : "Post to X"}
          </button>
        </form>
      </div>
  
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-5 border w-full max-w-xl shadow-lg rounded-md bg-white mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Generated Content</h3>
            <textarea
              readOnly
              value={randomContent}
              className="w-full p-3 border border-gray-300 rounded-md mb-4 resize-none focus:outline-none focus:ring-blue-500"
              rows={10}
              onClick={(e) => e.target.select()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCopyContent}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Copy Content
              </button>
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XPost;