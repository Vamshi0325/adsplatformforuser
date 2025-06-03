import React from "react";
import styled from "styled-components";

const WithdrawCard = ({
  label = "Confirm Withdrawal",
  network = "—",
  wallet = "—",
  amount = "0.00",
  onCancel,
  onConfirm,
  isConfirming = false,
}) => {
  // Helper to shorten wallet if too long
  const shortenWallet = (address, maxLength = 22) => {
    if (!address) return "";
    if (address.length <= maxLength) return address;
    const sliceLength = Math.floor((maxLength - 3) / 2);
    return (
      address.slice(0, sliceLength) +
      "..." +
      address.slice(address.length - sliceLength)
    );
  };

  return (
    <StyledWrapper>
      <div className="card">
        <div className="container-card bg-yellow-box">
          <p className="card-label">{label}</p>

          <div className="details">
            <div>
              <span className="detail-title">Network:</span>{" "}
              <span className="detail-value">{network}</span>
            </div>
            <div>
              <span className="detail-title">Wallet:</span>{" "}
              <span className="detail-value wallet" title={wallet}>
                {shortenWallet(wallet)}
              </span>
            </div>
            <div>
              <span className="detail-title">Amount:</span>{" "}
              <span className="detail-value">${amount}</span>
            </div>
          </div>

          <div className="button-group">
            <button
              className="btn cancel"
              onClick={onCancel}
              disabled={isConfirming}
            >
              Cancel
            </button>
            <button
              className="btn confirm"
              onClick={onConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? "Submitting..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    max-width: 400px;
    width: 100%;
    margin: 0 auto;
  }

  .container-card {
    position: relative;
    border: 2px solid transparent;
    background: linear-gradient(71deg, #080509, #1a171c, #080509);
    background-clip: padding-box;
    border-radius: 45px;
    padding: 40px;
    text-align: center;
    color: #fff;
    user-select: none;
  }

  .bg-yellow-box {
    position: relative;
  }

  .bg-yellow-box::after {
    position: absolute;
    top: -1px;
    bottom: -1px;
    left: -1px;
    right: -1px;
    content: "";
    z-index: -1;
    border-radius: 45px;
    background: linear-gradient(71deg, #110e0e, #afa220, #110e0e);
  }

  .card-label {
    font-weight: 700;
    font-size: 32px;
    letter-spacing: -0.02em;
    margin-bottom: 24px;
    color: white;
  }

  .details {
    text-align: left;
    margin-bottom: 32px;
    font-weight: 600;
    font-size: 18px;
    line-height: 1.5;

    div {
      margin-bottom: 12px;
    }
  }

  .detail-title {
    color: #afa220;
    font-weight: 700;
  }

  .detail-value.wallet {
    font-family: monospace;
    background-color: rgba(175, 162, 32, 0.15);
    padding: 4px 8px;
    border-radius: 8px;
    user-select: all;
    cursor: default;
  }

  .button-group {
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .btn {
    font-weight: 700;
    border-radius: 24px;
    padding: 12px 32px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s ease;
    border: none;
    user-select: none;
  }

  .btn.cancel {
    background: #444;
    color: #eee;
  }

  .btn.cancel:hover:not(:disabled) {
    background: #666;
  }

  .btn.confirm {
    background: linear-gradient(90deg, #d7d42b, #f6ee5b);
    color: #1a170d;
    box-shadow: 0 0 10px #f6ee5b;
  }

  .btn.confirm:hover:not(:disabled) {
    background: linear-gradient(90deg, #f6ee5b, #d7d42b);
    box-shadow: 0 0 15px #d7d42b;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default WithdrawCard;
