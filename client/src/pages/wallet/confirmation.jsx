import React, { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { getUser, verifyMonnifyTransaction } from "../../api";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

const Confirmation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending")

  const { data: user, error: userError } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const { mutate, isLoading, isError, isSuccess } = useMutation({
    mutationFn: () => verifyMonnifyTransaction(id, user?._id),
    onSuccess: (response) => {
        if(response.status === "paid") {
            setStatus("paid")
            toast.success(response.message);
      queryClient.invalidateQueries(["wallet"]);
        } else if(response.status === "pending") {
            setStatus("pending")
            toast.warning(response.message);
        } else {
            setStatus("failed")
            toast.error(response.message);
        }
      
    },
    onError: (error) => {
      toast.error("Error verifying transaction: " + error.message);
    },
  });

  React.useEffect(() => {
    if (user?._id && id) {
      mutate();
    }
  }, [user, id, mutate]);

  const verificationStatus = isLoading
    ? "loading"
    : isError
    ? "error"
    : isSuccess
    ? "success"
    : null;

  return (
    <>
      <h1 className="text-2xl font-bold mb-5">Confirmation Page</h1>
      <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm w-full text-center">
          {status === "pending" && (
            <>
              <FaSpinner className="animate-spin text-blue-500 text-4xl mb-4" />
              <p>Verifying your transaction...</p>
            </>
          )}
          {status === "paid" && (
            <>
              <FaCheckCircle className="text-green-500 text-4xl mb-4" />
              <h2 className="text-xl font-semibold mb-2">Success!</h2>
              <p>Your transaction was completed successfully.</p>
            </>
          )}
          {status === "failed" && (
            <>
              <FaTimesCircle className="text-red-500 text-4xl mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failure!</h2>
              <p>There was an error processing your transaction.</p>
            </>
          )}
          {status === "paid" ? <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
          >
            Go Back
          </button> : <button
            onClick={() => {
                if (user?._id && id) {
                    mutate();
                  }
            }}
            className="mt-4 bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
          >
            Check Status
          </button> }
        </div>
        <strong className="my-5 text-center text-gray-400 text-sm">Do NOT close this page. Ensure you check your ststus!</strong>
      </div>
    </>
  );
};

export default Confirmation;