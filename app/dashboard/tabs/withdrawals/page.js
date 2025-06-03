"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { authHandlers } from "@/services/api-handlers";
import Card from "@/components/balance-card";
import WithdrawCard from "@/components/withdrawal-card";

export default function WithdrawalsPage() {
  const { user, refreshUserData } = useAuth();

  const userIncompleteProfile =
    !user?.userdata?.Address ||
    !user?.userdata?.City ||
    !user?.userdata?.Country;

  // Withdraw form states
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [networkId, setNetworkId] = useState("");
  const [errors, setErrors] = useState({});

  // Modals & loading
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProfileIncompletePopup, setShowProfileIncompletePopup] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & pagination
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [walletSearch, setWalletSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState(""); // use network._id or "" for all
  const [statusFilter, setStatusFilter] = useState(""); // "" means all statuses
  const [filtersChanged, setFiltersChanged] = useState(false);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState(null);

  // Data
  const [networksList, setNetworksList] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    limit: 10,
    totalPages: 1,
  });

  const availableStatuses = [
    { label: "All Statuses", value: "" },
    { label: "PENDING", value: "PENDING" },
    { label: "TRANSFERRED", value: "TRANSFERRED" },
    { label: "REJECTED", value: "REJECTED" },
  ];

  // Shorten wallet for display
  const shortenWallet = (address) => {
    if (!address || address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Format date as DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date for API YYYY-MM-DD
  const formatDateForAPI = (date) => {
    if (!date) return undefined;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch active networks
  const fetchNetworks = useCallback(async () => {
    try {
      const res = await authHandlers.getActiveNetworks();
      if (res.status === 200) {
        setNetworksList(res.data?.networks?.docs || []);
      }
    } catch (err) {
      console.error("Failed to load networks:", err);
    }
  }, []);

  // Fetch withdrawals with filters & pagination
  const fetchWithdrawals = useCallback(
    async (page = 1) => {
      setLoadingWithdrawals(true);
      setWithdrawalsError(null);

      const sFilter = statusFilter || undefined;
      const nFilter = networkFilter || undefined;
      const wSearch = walletSearch.trim() || undefined;
      const sDate =
        startDate && endDate ? formatDateForAPI(startDate) : undefined;
      const eDate =
        startDate && endDate ? formatDateForAPI(endDate) : undefined;

      try {
        const res = await authHandlers.getUserWithdrawals({
          page,
          limit: pagination.limit,
          status: sFilter,
          network: nFilter,
          wallet: wSearch,
          startDate: sDate,
          endDate: eDate,
        });

        setWithdrawals(res.data.withdrawals?.docs || []);
        setPagination({
          totalDocs: res.data.withdrawals?.totalDocs || 0,
          limit: res.data.withdrawals?.limit || 10,
          totalPages: res.data.withdrawals?.totalPages || 1,
        });
        setCurrentPage(res.data.withdrawals?.page || 1);
      } catch {
        setWithdrawalsError("Failed to load withdrawal data");
      } finally {
        setLoadingWithdrawals(false);
      }
    },
    [
      statusFilter,
      networkFilter,
      walletSearch,
      startDate,
      endDate,
      pagination.limit,
    ]
  );

  // Load networks once
  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  // When filters change, mark filtersChanged to trigger fetch, reset page to 1
  useEffect(() => {
    setFiltersChanged(true);
    setCurrentPage(1);
  }, [networkFilter, statusFilter, walletSearch, startDate, endDate]);

  // Fetch withdrawals on filtersChanged flag
  useEffect(() => {
    if (filtersChanged) {
      // only fetch if both dates set or both unset
      if ((startDate && endDate) || (!startDate && !endDate)) {
        fetchWithdrawals(1);
        setFiltersChanged(false);
      }
    }
  }, [filtersChanged, fetchWithdrawals, startDate, endDate]);

  // Fetch on page change only if filters stable
  useEffect(() => {
    if (!filtersChanged) {
      fetchWithdrawals(currentPage);
    }
  }, [currentPage, filtersChanged, fetchWithdrawals]);

  // Validation for withdrawal form
  const validateForm = () => {
    const errs = {};
    if (!networkId) errs.networkId = "Network is required";
    if (!walletAddress) errs.walletAddress = "Wallet address is required";
    else if (walletAddress.length < 10)
      errs.walletAddress = "Please enter a valid wallet address";

    const userBalance = Number(user?.userdata?.Balance) || 0;
    const amt = Number.parseFloat(amount);

    const selectedNet = networksList.find((n) => n._id === networkId);
    const minWithdraw = selectedNet ? Number(selectedNet.MINWithdraw) : null;
    const maxWithdraw = selectedNet ? Number(selectedNet.MAXWithdraw) : null;

    if (userBalance <= 0) {
      errs.amount = "Insufficient balance to make a withdrawal";
    } else if (!amount || isNaN(amt) || amt <= 0) {
      errs.amount = "Please enter a valid amount";
    } else if (amt > userBalance) {
      errs.amount = `Amount exceeds your available balance (${userBalance} USDT)`;
    } else if (minWithdraw !== null && amt < minWithdraw) {
      errs.amount = `Amount must be at least ${minWithdraw} USDT for this network`;
    } else if (maxWithdraw !== null && amt > maxWithdraw) {
      errs.amount = `Amount must not exceed ${maxWithdraw} USDT for this network`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const selectedNetwork = networksList.find((n) => n._id === networkId);

  // Submit withdraw form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userIncompleteProfile) {
      setShowProfileIncompletePopup(true);
      return;
    }
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  // Confirm withdrawal API call
  const confirmWithdrawal = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const data = {
        NetworkId: networkId,
        WalletAddress: walletAddress,
        AmountInUSD: Number.parseFloat(amount),
      };

      const res = await authHandlers.withdrawRequest(data);

      if (res && res.status === 201) {
        toast.success(res.data.message);

        // Reset form
        setWalletAddress("");
        setAmount("");
        setNetworkId("");

        setCurrentPage(1);
        await fetchWithdrawals(1);
        await refreshUserData();
      } else {
        toast.error("Failed to submit withdrawal request");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Something went wrong while submitting withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear filters & trigger fetch once
  const clearFilters = () => {
    setNetworkFilter("");
    setStatusFilter("");
    setWalletSearch("");
    setStartDate(null);
    setEndDate(null);
    setFiltersChanged(true);
    setCurrentPage(1);
  };

  // Status badge classes
  const getStatusClass = (status) => {
    switch (status) {
      case "TRANSFERRED":
        return "bg-green-600 text-white";
      case "PENDING":
        return "bg-amber-500 text-white";
      case "REJECTED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Pagination pages with dots helper
  const getPaginationPages = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="text-white">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6">Withdrawal</h1>

      <div className="bg-blue-900 rounded-lg p-6 shadow-md flex flex-col gap-6">
        {/* Mobile balance card */}
        <div className="flex items-center justify-center lg:hidden p-0 ">
          <Card
            balance={user?.userdata?.Balance?.toFixed(2) || "0.00"}
            label="Available for withdrawal"
            imageSrc="/images/tether-usdt-logo.png"
            imageAlt="USDT Logo"
            imageWidth={80}
            imageHeight={80}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <form
            className="flex-1 flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="bg-blue-800 rounded-md p-4 border border-blue-700 flex items-center gap-2 text-blue-200">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
              <p>
                Withdrawals may take up to 3 business days to process.
                Double-check your wallet address before submitting.
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="network"
                className="block mb-1 font-semibold text-white"
              >
                Network <span className="text-red-500">*</span>
              </label>
              <select
                id="network"
                value={networkId}
                onChange={(e) => {
                  setNetworkId(e.target.value);
                  setErrors((errs) => ({ ...errs, networkId: null }));
                }}
                className={`w-full rounded-md bg-blue-800 border px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.networkId ? "border-red-500" : "border-blue-700"
                }`}
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select network
                </option>
                {networksList.map((network) => (
                  <option key={network._id} value={network._id}>
                    {network.Network}
                  </option>
                ))}
              </select>
              {errors.networkId && (
                <p className="text-red-400 text-xs mt-1">{errors.networkId}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="wallet"
                className="block mb-1 font-semibold text-white"
              >
                Wallet Address <span className="text-red-500">*</span>
              </label>
              <input
                id="wallet"
                type="text"
                placeholder="Enter your wallet address"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  setErrors((errs) => ({ ...errs, walletAddress: null }));
                }}
                className={`w-full rounded-md bg-blue-800 border px-4 py-3 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.walletAddress ? "border-red-500" : "border-blue-700"
                }`}
                disabled={isSubmitting}
              />
              {errors.walletAddress && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.walletAddress}
                </p>
              )}
            </div>

            <div className="mb-6 relative">
              <label
                htmlFor="amount"
                className="block mb-1 font-semibold text-white"
              >
                Amount (USDT) <span className="text-red-500">*</span>
              </label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors((errs) => ({ ...errs, amount: null }));
                }}
                className={`w-full rounded-md bg-blue-800 border px-4 py-3 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition no-spin ${
                  errors.amount ? "border-red-500" : "border-blue-700"
                }`}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown")
                    e.preventDefault();
                }}
                disabled={isSubmitting}
              />
              {selectedNetwork && (
                <p className="text-blue-300 mt-1 text-sm">
                  Min: {selectedNetwork.MINWithdraw} USDT, Max:{" "}
                  {selectedNetwork.MAXWithdraw} USDT
                </p>
              )}
              {errors.amount && (
                <p className="text-red-400 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                !(networkId && walletAddress.trim() && amount.trim()) ||
                isSubmitting
              }
              className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                px-6 py-3 rounded-lg font-semibold transition w-full lg:w-auto
                ${
                  !(networkId && walletAddress.trim() && amount.trim()) ||
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "text-white"
                }
              `}
            >
              {isSubmitting ? "Processing..." : "Withdraw"}
            </button>
          </form>

          {/* Desktop balance card */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center  p-3 max-w-xs mx-auto  ">
            <Card
              balance={user?.userdata?.Balance?.toFixed(2) || "0.00"}
              label="Available for withdrawal"
              imageSrc="/images/tether-usdt-logo.png"
              imageAlt="USDT Logo"
              imageWidth={80}
              imageHeight={80}
            />
          </div>
        </div>
      </div>

      {/* Filters toggle and clear */}
      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-xl font-semibold text-white">
          Transaction History
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 rounded-lg hover:bg-blue-800 text-white transition duration-300 ease-in-out"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17v-3.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          {showFilters &&
            (networkFilter ||
              statusFilter ||
              walletSearch.trim() ||
              startDate ||
              endDate) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 text-white transition duration-300 ease-in-out"
              >
                Clear Filters
              </button>
            )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-blue-900 rounded-lg p-6 shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <input
              type="date"
              value={startDate ? startDate.toISOString().slice(0, 10) : ""}
              onChange={(e) => {
                setStartDate(e.target.value ? new Date(e.target.value) : null);
                setFiltersChanged(true);
              }}
              className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate ? endDate.toISOString().slice(0, 10) : ""}
              onChange={(e) => {
                setEndDate(e.target.value ? new Date(e.target.value) : null);
                setFiltersChanged(true);
              }}
              className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="End Date"
            />
            <input
              type="text"
              placeholder="Search Wallet"
              className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={walletSearch}
              onChange={(e) => {
                setWalletSearch(e.target.value);
                setFiltersChanged(true);
              }}
            />
            <select
              className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={networkFilter}
              onChange={(e) => {
                setNetworkFilter(e.target.value);
                setFiltersChanged(true);
              }}
            >
              <option value="">All Networks</option>
              {networksList.map((network) => (
                <option key={network._id} value={network._id}>
                  {network.Network}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setFiltersChanged(true);
              }}
            >
              {availableStatuses.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Withdrawals table for desktop */}
      <div className="bg-blue-900 rounded-lg p-4 shadow-md overflow-auto hidden sm:block">
        {loadingWithdrawals ? (
          <p className="text-center text-white py-6">Loading...</p>
        ) : withdrawalsError ? (
          <p className="text-center text-red-400 py-6">{withdrawalsError}</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-center text-white py-6">No withdrawals found.</p>
        ) : (
          <table className="w-full table-auto border-collapse text-white">
            <thead>
              <tr className="border-b border-blue-700">
                <th className="text-center px-6 py-4">Date</th>
                <th className="text-center px-6 py-4">Wallet</th>
                <th className="text-center px-6 py-4">Network</th>
                <th className="text-center px-6 py-4">Amount</th>
                <th className="text-center px-6 py-4">Fee</th>
                <th className="text-center px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((tx) => (
                <tr
                  key={tx._id}
                  className="border-b border-blue-800 hover:bg-blue-800"
                >
                  <td className="text-center px-6 py-4">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td
                    className="text-center px-6 py-4 cursor-pointer"
                    title={tx.WalletAddress}
                    onClick={() => {
                      navigator.clipboard.writeText(tx.WalletAddress);
                      toast.success("Wallet copied!");
                    }}
                  >
                    {shortenWallet(tx.WalletAddress)}
                  </td>
                  <td className="text-center px-6 py-4">
                    {tx.NetworkId?.Network || "-"}
                  </td>
                  <td className="text-center px-6 py-4">
                    ${tx.AmountInUSD.toFixed(2)}
                  </td>
                  <td className="text-center px-6 py-4">$0.00</td>
                  <td className="text-center px-6 py-4">
                    <span
                      className={`inline-flex justify-center items-center w-24 h-7 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusClass(
                        tx.Status
                      )}`}
                    >
                      {tx.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards with headers on left and data on right */}
      <div className="sm:hidden space-y-4">
        {loadingWithdrawals ? (
          <p className="text-center text-white py-6">Loading...</p>
        ) : withdrawalsError ? (
          <p className="text-center text-red-400 py-6">{withdrawalsError}</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-center text-white py-6">No withdrawals found.</p>
        ) : (
          withdrawals.map((tx) => (
            <div
              key={tx._id}
              className="bg-blue-900 rounded-lg p-4 shadow-md text-white"
            >
              <div className="flex justify-between py-1">
                <span className="font-semibold text-blue-300 w-32">Date</span>
                <span>{formatDate(tx.createdAt)}</span>
              </div>
              <div
                className="flex justify-between py-1 cursor-pointer"
                title={tx.WalletAddress}
                onClick={() => {
                  navigator.clipboard.writeText(tx.WalletAddress);
                  toast.success("Wallet copied!");
                }}
              >
                <span className="font-semibold text-blue-300 w-32">Wallet</span>
                <span>
                  {tx.WalletAddress.length > 15
                    ? tx.WalletAddress.slice(0, 8) +
                      "..." +
                      tx.WalletAddress.slice(-6)
                    : tx.WalletAddress}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-blue-300 w-32">
                  Network
                </span>
                <span>{tx.NetworkId?.Network || "-"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-blue-300 w-32">Amount</span>
                <span>${tx.AmountInUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-blue-300 w-32">Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-blue-300 w-32">Status</span>
                <span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusClass(
                      tx.Status
                    )}`}
                  >
                    {tx.Status}
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination controls with show rows */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
        {/* Show rows select */}
        <div className="flex items-center gap-2 text-white">
          <label htmlFor="rowsPerPage" className="text-white">
            Show rows
          </label>
          <select
            id="rowsPerPage"
            className="bg-blue-800 border border-blue-700 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={pagination.limit}
            onChange={(e) => {
              setPagination((p) => ({
                ...p,
                limit: Number(e.target.value),
              }));
              setFiltersChanged(true);
              setCurrentPage(1);
            }}
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
          >
            First
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
          >
            Prev
          </button>

          {getPaginationPages(currentPage, pagination.totalPages).map(
            (page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className="px-2 select-none">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded transition ${
                    page === currentPage
                      ? "bg-blue-600 font-bold"
                      : "bg-blue-800 hover:bg-blue-700"
                  }`}
                >
                  {page}
                </button>
              )
          )}

          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={currentPage === pagination.totalPages}
            className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
          >
            Next
          </button>

          <button
            onClick={() => setCurrentPage(pagination.totalPages)}
            disabled={currentPage === pagination.totalPages}
            className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
          >
            Last
          </button>
        </div>
      </div>

      {/* Profile incomplete popup */}
      {showProfileIncompletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-blue-900 p-6 rounded-lg max-w-md w-full text-white shadow-lg">
            <h3 className="text-xl font-semibold mb-4">
              Complete Your Profile
            </h3>
            <p className="mb-6">
              Please verify and update your profile with Address, City, and
              Country before making withdrawals.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowProfileIncompletePopup(false)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowProfileIncompletePopup(false);
                  window.location.href = "/dashboard/tabs/profile";
                }}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition text-white"
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <WithdrawCard
            label="Confirm Withdrawal"
            network={
              networksList.find((n) => n._id === networkId)?.Network || "—"
            }
            wallet={walletAddress}
            amount={Number(amount).toFixed(2)}
            isConfirming={isSubmitting}
            onCancel={() => setShowConfirmModal(false)}
            onConfirm={confirmWithdrawal}
          />
        </div>
      )}
    </div>
  );
}
