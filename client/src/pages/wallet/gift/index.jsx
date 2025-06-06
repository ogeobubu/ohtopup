import React, { useState } from "react";
import Button from "../../../components/ui/forms/button";
import Modal from "../../../admin/components/modal";
import Withdraw from "./withdraw";

const Gift = ({ user, isDarkMode }) => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const openWithdrawModal = () => setIsWithdrawModalOpen(true);
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);

  return (
    <div className={`mt-5 p-4 border max-w-2xl rounded-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-col">
        <div className="rounded-lg w-full">
          <h1 className="text-sm sm:text-md text-gray-500 font-bold mb-4">
            Points Balance
          </h1>
          <div className="mb-3 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <span className="text-4xl md:text-5xl font-bold mr-2">{user?.points || 0}</span>
              <span className="text-xs sm:text-sm">
                10 Points = <strong className="font-bold">1 Naira</strong>
              </span>
            </div>
            <div className="mt-4 md:mt-0 md:ml-auto">
              <Button className="px-4" onClick={openWithdrawModal}>
                Redeem Point
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4 dark:text-white text-gray-800">
          Understanding Gift Points
        </h2>
        <p className={`dark:text-white text-gray-700 mb-4`}>
          Gift points are like rewards on OhTopUp. Users may receive rewards for
          performing certain actions and carrying out transactions within the
          platform. Users can also be rewarded with points manually by OhTopUp.
        </p>
        <p className={`dark:text-white text-gray-700 mb-4`}>
          In turn, users can redeem these gift points for real money.
        </p>

        <h3 className="text-xl md:text-2xl font-semibold mb-2 dark:text-white text-gray-800">
          About Gift Points Wallet
        </h3>
        <p className={`dark:text-white text-gray-700 mb-4`}>
          Every user has a gift points wallet which can be accessed by going to{" "}
          <strong>Wallets &gt; Gift Points</strong>. The wallet shows your gift
          points balance, your gift points history (which includes gift points
          you've earned and redeemed), and the option to redeem the gift points
          for cash.
        </p>

        <p className={`dark:text-white text-gray-700 mb-4`}>
          Whenever you earn gift points, you will be notified and you will also
          see it in your gift points wallet.
        </p>

        <h3 className="text-xl md:text-2xl font-semibold mb-2 dark:text-white text-gray-800">
          Redeeming Gift Points For Cash
        </h3>
        <p className={`dark:text-white text-gray-700 mb-4`}>
          You can always redeem your gift points balance to your Naira wallet.
        </p>
        <p className={`dark:text-white text-gray-700 mb-4`}>
          At the moment, 10 gift points = 1 Naira equivalent. Meaning, if you
          have 20,000 gift points, you can redeem it for 2,000 Naira to your
          Naira wallet.
        </p>
        <p className={`dark:text-white text-gray-700 mb-4`}>
          There’s a minimum amount of gift points you can redeem. You will see
          this on the gift points redemption page. This means, if the minimum
          redeemable gift points amount is 10,000, you won't be able to redeem
          less than 10,000 at a time.
        </p>
      </div>

      <Modal
        isOpen={isWithdrawModalOpen}
        closeModal={closeWithdrawModal}
        title="Redeem Points"
        isDarkMode={isDarkMode}
      >
        <Withdraw isDarkMode={isDarkMode} user={user} closeModal={closeWithdrawModal} />
      </Modal>
    </div>
  );
};

export default Gift;