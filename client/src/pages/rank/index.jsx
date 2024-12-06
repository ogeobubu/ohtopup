import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRanking } from "../../api";
import { FaTrophy, FaUser } from "react-icons/fa"; // Import icons from react-icons

const Rank = () => {
  const [activeTab, setActiveTab] = useState("Ranking");
  const [countdown, setCountdown] = useState(0);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const { data, error, isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: getRanking,
    staleTime: 10000,
  });

  useEffect(() => {
    if (data) {
      setCountdown(data.countdown);
    }
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d : ${hours}h : ${minutes}m : ${secs}s`;
  };

  return (
    <>
      <div className="mb-3 flex rounded-lg border border-solid max-w-xs border-gray-300 bg-blue-500 py-1 px-1">
        {["Ranking", "Position"].map((tab) => (
          <button
            key={tab}
            className={`py-1 px-3 font-medium transition-colors duration-300 ${
              activeTab === tab
                ? "text-white bg-green-600 rounded-lg w-40"
                : "text-gray-200 hover:text-white hover:bg-green-500 w-40"
            }`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col max-w-sm">
        <h1 className="text-3xl font-bold my-4 text-center text-blue-600">
          <FaTrophy className="inline-block mr-2" />
          Leaderboard
        </h1>
        <div className="bg-white text-black p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FaUser className="mr-2 text-blue-500" />
            Winners
          </h2>
          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : error ? (
            <div className="text-red-500 text-center">Error fetching rankings: {error.message}</div>
          ) : (
            <div className="mt-2">
              {data?.rankings?.map((winner, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b py-2 hover:bg-gray-100"
                >
                  <span className="text-gray-700">{winner.username}</span>
                  <span className="font-bold text-blue-500">{winner.rank}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <span className="font-semibold">Time Left: </span>
            <span className="font-bold text-green-600">{formatCountdown(countdown)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Rank;