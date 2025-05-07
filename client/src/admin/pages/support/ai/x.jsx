import React, { useState } from "react";
import Textfield from "../../../../components/ui/forms/input";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postTweetToX, triggerTelcoRepost, initiateXAuth } from '../../../api';
import { toast } from 'react-toastify';

const XPost = () => {
  const [postText, setPostText] = useState('');

  const queryClient = useQueryClient();

  const postTweetMutation = useMutation({
    mutationFn: postTweetToX,
    onSuccess: (data) => {
      toast.success('Tweet posted successfully!');
      setPostText('');
    },
    onError: (error) => {
      toast.error(`Error posting tweet: ${error.message || 'An unexpected error occurred.'}`);
    },
  });

   const triggerRepostMutation = useMutation({
     mutationFn: triggerTelcoRepost,
     onSuccess: (data) => {
        toast.success('Manual repost check triggered. Check backend logs for details.');
     },
     onError: (error) => {
        toast.error(`Error triggering repost: ${error.message || 'An unexpected error occurred.'}`);
     }
   });


  const handlePostSubmit = (e) => {
    e.preventDefault();

    if (!postText.trim()) {
      toast.info('Please enter text for your post.');
      return;
    }

    postTweetMutation.mutate(postText);
  };

   const handleTriggerRepost = () => {
      triggerRepostMutation.mutate();
   };

   const handleInitiateAuth = () => {
       initiateXAuth();
       toast.info('Redirecting to X for authentication...');
   };


  return (
    <div className="border border-solid border-gray-200 rounded-md p-3 w-full max-w-4xl mx-auto shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">X API Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="flex flex-col space-y-8">

            <div className="border border-solid border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">X Account Connection</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Authorize your X account to enable posting and automatic reposting features.
                </p>
                <button
                   onClick={handleInitiateAuth}
                   className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                  >
                   Connect X Account
                 </button>
            </div>

            <div className="border border-solid border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">Create New Post</h3>
              <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
                <Textfield
                  label="Post Content"
                  type="textarea"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's happening on X? (Max 280 characters)"
                  rows={4}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={postTweetMutation.isLoading || !postText.trim()}
                >
                  {postTweetMutation.isLoading ? 'Posting...' : 'Post to X'}
                </button>
              </form>
            </div>
        </div>

        <div className="flex flex-col space-y-8">
             <div className="border border-solid border-gray-200 rounded-md p-4 bg-gray-50">
                 <h3 className="text-xl font-semibold mb-3 text-gray-700">Repost Telco Posts</h3>
                  <p className="text-sm text-gray-600 mb-4">
                     Automatically repost the latest post from MTN, Airtel, Glo, and 9mobile official accounts.
                     A scheduled job runs periodically in the backend for this.
                 </p>
                  <button
                    onClick={handleTriggerRepost}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={triggerRepostMutation.isLoading}
                   >
                    {triggerRepostMutation.isLoading ? 'Checking...' : 'Repost Check'}
                  </button>
             </div>

        </div>

      </div>

    </div>
  );
};

export default XPost;