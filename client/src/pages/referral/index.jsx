import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from 'react-redux';
import { getUser, getReferrals as getReferralsApi } from "../../api";
import { FaShareAlt } from 'react-icons/fa';
import gift from "../../assets/gift.svg";
import noData from "../../assets/no-data.svg";
import Pagination from "../../admin/components/pagination";

const Referral = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const user = useSelector((state) => state.user.user);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const { data: referrals, isLoading, isError, error } = useQuery({
    queryKey: ['referrals', { page: currentPage, limit, search: debouncedSearchTerm }],
    queryFn: () => getReferralsApi(currentPage, limit, debouncedSearchTerm),
    keepPreviousData: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on this platform!',
          text: `Use my referral code: ${user?.referralCode}`,
          url: window.location.href,
        });
        toast.success('Referral code shared successfully!');
      } catch {
        toast.error('Failed to share the referral code.');
      }
    } else {
      navigator.clipboard.writeText(user?.referralCode);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  return (
    <>
      <h2 className={`text-lg sm:text-xl font-bold mb-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
        Referral
      </h2>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Referral Code Section */}
        <div className={`flex-1 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} min-h-[250px] flex flex-col justify-between rounded-lg shadow-md`}>
          <div>
            <div className="flex justify-center items-center w-40 mb-3 mx-auto">
              <img className="object-cover w-full" src={gift} alt="gift" />
            </div>
            <h2 className={`text-lg sm:text-xl font-bold text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Refer your friends and earn
            </h2>
            <p className={`mt-2 text-center text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Earn referral bonus when your friends sign up with your referral code and trade successfully.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center mx-auto">
            <span className={`bg-white border border-solid border-gray-300 py-2 px-4 rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
              {user?.referralCode}
            </span>
            <button
              className="ml-3 bg-blue-500 text-white px-4 py-2 rounded flex items-center"
              onClick={handleShare}
            >
              <FaShareAlt className="mr-2" /> Share
            </button>
          </div>
        </div>

        {/* Referrals Table Section */}
        <div className={`flex-1 md:pl-6 md:pr-6 min-h-[250px] flex flex-col justify-between ${isDarkMode ? 'bg-gray-800' : ''}`}>
          {isLoading ? (
            <p>Loading referrals...</p>
          ) : isError ? (
            <p className="text-red-500">Error loading referrals: {error.message}</p>
          ) : referrals?.users.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="flex justify-between items-center my-4">
                <h2 className={`text-lg sm:text-xl font-bold mr-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Referrals
                </h2>
                <div className="flex items-center gap-2">
                  <input 
                    type="search" 
                    placeholder="Search by username or email"
                    className={`border border-gray-300 rounded-md p-2 w-full sm:w-64 ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : ''}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    className="ml-2 bg-red-500 text-white px-3 py-1 rounded"
                    onClick={handleClearSearch}
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <table className={`min-w-full ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'} border border-gray-300`}>
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className="py-3 px-4 text-left text-gray-600">Username</th>
                    <th className="py-3 px-4 text-left text-gray-600">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {referrals.users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 transition duration-200">
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination 
                currentPage={currentPage} 
                totalPages={referrals.totalPages} 
                onPageChange={setCurrentPage} 
              />
            </div>
          ) : (
            <div className={`border border-solid rounded-md border-gray-300 p-6 flex flex-col items-center justify-center h-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <img className="w-24 h-24 mx-auto mb-4" src={noData} alt="No data" />
              <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                No referral history
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Referral;