import React, { useState } from "react";
import Button from "../../../components/ui/forms/button";
import Modal from "../../../admin/components/modal";
import Withdraw from "./withdraw";

const Gift = ({ user, isDarkMode }) => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const openWithdrawModal = () => setIsWithdrawModalOpen(true);
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);

  return (
    <div className={`mt-4 md:mt-5 p-3 md:p-4 border max-w-2xl mx-auto rounded-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-col">
        <div className="rounded-lg w-full">
          <h1 className="text-sm md:text-base text-gray-500 font-bold mb-3 md:mb-4">
            Points Balance
          </h1>
          <div className="mb-3 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
            <div className="flex items-center">
              <span className="text-2xl md:text-4xl lg:text-5xl font-bold mr-2">{user?.points || 0}</span>
              <span className="text-xs md:text-sm">
                10 Points = <strong className="font-bold">1 Naira</strong>
              </span>
            </div>
            <div className="w-full md:w-auto md:ml-auto">
              <Button className="px-4 py-2 w-full md:w-auto text-sm md:text-base" onClick={openWithdrawModal}>
                Redeem Point
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-5 p-4 md:p-6">
        <h2 className="text-base md:text-lg lg:text-xl font-bold mb-3 md:mb-4 dark:text-white text-gray-800">
          Understanding Gift Points
        </h2>
        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
          Gift points are like rewards on OhTopUp. Users may receive rewards for
          performing certain actions and carrying out transactions within the
          platform. Users can also be rewarded with points manually by OhTopUp.
        </p>
        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
          In turn, users can redeem these gift points for real money.
        </p>

        <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2 dark:text-white text-gray-800">
          About Gift Points Wallet
        </h3>
        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
          Every user has a gift points wallet which can be accessed by going to{" "}
          <strong>Wallets &gt; Gift Points</strong>. The wallet shows your gift
          points balance, your gift points history (which includes gift points
          you've earned and redeemed), and the option to redeem the gift points
          for cash.
        </p>

        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
          Whenever you earn gift points, you will be notified and you will also
          see it in your gift points wallet.
        </p>

        <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2 dark:text-white text-gray-800">
          Redeeming Gift Points For Cash
        </h3>
        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
          You can always redeem your gift points balance to your Naira wallet.
        </p>
        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
          At the moment, 10 gift points = 1 Naira equivalent. Meaning, if you
          have 20,000 gift points, you can redeem it for 2,000 Naira to your
          Naira wallet.
        </p>
        <p className={`dark:text-white text-gray-700 mb-3 md:mb-4 text-sm md:text-base leading-relaxed`}>
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