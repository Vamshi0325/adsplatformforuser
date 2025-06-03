"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Search,
  FileText,
  PiggyBank,
  LogOut,
  PauseCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { authHandlers } from "@/services/api-handlers";
import { useAuth } from "@/context/auth-context";
import { pdf } from "@react-pdf/renderer";
import PaymentReceiptPDF from "@/components/PaymentReceiptPDF";

export default function PaymentsPage() {
  // Filters state
  const [startDate, setStartDate] = useState(null); // Date objects or null
  const [endDate, setEndDate] = useState(null);
  const [walletFilter, setWalletFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");

  // Track if filters changed, to reset page once per filter change
  const [filtersChanged, setFiltersChanged] = useState(false);

  // UI & data states
  const [showFilters, setShowFilters] = useState(false);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState(null);
  const [networksList, setNetworksList] = useState([]);
  const [supportData, setSupportData] = useState(null);
  const [withdrawalData, setWithdrawalData] = useState(null);

  // Pagination & filter change tracking
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0,
    hasPrevPage: false,
    hasNextPage: false,
  });

  const { user } = useAuth();

  // Format date for display DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
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

  // Get support/company info for receipts
  const getSupportData = useCallback(async () => {
    try {
      const response = await authHandlers.getSupportData();
      const support = response.data?.Supportdata;
      if (support) setSupportData(support);
    } catch (error) {
      console.error("getSupportData error:", error);
    }
  }, []);

  // Fetch active networks for dropdown
  const fetchNetworks = useCallback(async () => {
    try {
      const netResp = await authHandlers.getActiveNetworks();
      if (netResp.status === 200) {
        setNetworksList(netResp.data?.networks?.docs || []);
      }
    } catch (err) {
      console.error("Failed to load networks:", err);
    }
  }, []);

  // Build query params object ONLY with active filters + status=TRANSFERRED always
  const buildQueryParams = () => {
    const params = {
      status: "TRANSFERRED",
      page: pagination.page,
      limit: pagination.limit,
    };

    if (networkFilter.trim() !== "") params.network = networkFilter.trim();
    if (walletFilter.trim() !== "") params.wallet = walletFilter.trim();

    // Only include both dates if both set
    if (startDate && endDate) {
      params.startDate = formatDateForAPI(startDate);
      params.endDate = formatDateForAPI(endDate);
    }

    return params;
  };

  // Fetch withdrawals with filters and pagination
  const fetchWithdrawals = useCallback(async () => {
    setLoadingWithdrawals(true);
    setWithdrawalsError(null);

    try {
      const params = buildQueryParams();

      const withResp = await authHandlers.getUserWithdrawals(params);

      setWithdrawalData(withResp.data?.withdrawalData || null);
      // console.log("Withdrawal data:", withResp.data?.withdrawalData);

      const docs = withResp.data?.withdrawals?.docs || [];
      console.log("Withdrawals docs:", docs);

      setFilteredWithdrawals(docs);

      // Only update pagination fields EXCEPT page here to avoid loop
      setPagination((prev) => ({
        ...prev,
        // page: prev.page, // don't overwrite page here
        limit: withResp.data.withdrawals?.limit || prev.limit,
        totalPages: withResp.data.withdrawals?.totalPages || prev.totalPages,
        totalDocs: withResp.data.withdrawals?.totalDocs || prev.totalDocs,
        hasPrevPage: withResp.data.withdrawals?.hasPrevPage || false,
        hasNextPage: withResp.data.withdrawals?.hasNextPage || false,
      }));
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
      setWithdrawalsError("Failed to load withdrawal data");
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [
    networkFilter,
    walletFilter,
    startDate,
    endDate,
    pagination.page,
    pagination.limit,
  ]);

  // On mount, load support data and networks list
  useEffect(() => {
    getSupportData();
    fetchNetworks();
  }, [getSupportData, fetchNetworks]);

  // 1. Track filter changes to reset page
  useEffect(() => {
    setFiltersChanged(true);
  }, [walletFilter, networkFilter, startDate, endDate]);

  // 2. Reset page only once when filtersChanged is true
  useEffect(() => {
    if (filtersChanged) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setFiltersChanged(false);
    }
  }, [filtersChanged]);

  // Fetch withdrawals when filters, page or limit changes
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Clear all filters and reset pagination
  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setWalletFilter("");
    setNetworkFilter("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clipboard copy with toast
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Wallet address copied!");
  };

  // Build receipt data for PDF
  const buildReceiptDataFromWithdrawal = (w) => {
    console.log("Build receipt data from withdrawal:", w);

    const userData = user?.userdata || {};

    let toName = "";
    let toAddressLines = [];

    if (userData.AccountType === "Individual") {
      toName = `${userData.FirstName || ""} ${userData.LastName || ""}`.trim();
      toAddressLines = [
        userData.Address || "",
        userData.City || "",
        userData.Country || "",
      ].filter(Boolean);
    } else if (userData.AccountType === "Company") {
      toName = userData.CompanyName || "";
      toAddressLines = [
        userData.Address || "",
        userData.City || "",
        userData.Country || "",
      ].filter(Boolean);
    }

    return {
      transactionDate: new Date(w.createdAt).toISOString().slice(0, 10),
      transactionNetwork: w.NetworkId?.Network,
      transactionId: w._id,
      from: {
        name: supportData?.CompanyName,
        address: [supportData?.Address, supportData?.City, supportData?.Country]
          .filter(Boolean)
          .join(", "),
      },
      to: {
        name: toName,
        address: toAddressLines.join(", "),
      },
      items: [
        {
          description: "Online advertising services",
          amount: w.AmountInUSD || 0,
        },
      ],
      total: w.AmountInUSD || 0,
      paymentDetails: {
        walletAddress: w.WalletAddress,
      },
    };
  };

  // Generate and download PDF receipt
  const handleDownloadReceipt = async (withdrawal) => {
    // Build data as you do now
    const dynamicReceiptData = buildReceiptDataFromWithdrawal(withdrawal);

    // Create PDF document from the component with that data
    const doc = <PaymentReceiptPDF data={dynamicReceiptData} />;

    // Generate PDF blob
    const asPdf = pdf([]);
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();

    // Create blob URL and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment_receipt_${withdrawal._id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPaginationPages = (currentPage, totalPages) => {
    const delta = 2; // neighbors around current page
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

  // Status badge helper
  const getStatusBadgeClass = (status) => {
    if (status === "TRANSFERRED") {
      return "bg-green-500 text-white";
    }
    return "bg-gray-500 text-white";
  };

  // Shorten wallet for mobile view
  const shortenWallet = (addr) =>
    addr.length <= 12 ? addr : addr.slice(0, 6) + "..." + addr.slice(-4);

  // Totals for cards
  const totalTransferredAmount = withdrawalData?.TransferredAmount || 0;
  const totalBalance = withdrawalData?.Balance || 0;
  const holdBalance = withdrawalData?.PendingAmount || 0;
  const totalWithdrawals = withdrawalData?.totalAmount || 0;
  const rejectedBalance = withdrawalData?.rejectedAmount || 0;

  const glassCardClass =
    "flex justify-between items-center rounded-lg p-6 shadow-lg bg-white/10 backdrop-blur-md border";

  const iconWrapperClass =
    "flex items-center justify-center w-12 h-12 rounded-full drop-shadow-lg";

  return (
    <div className="text-white">
      {/* Title */}
      <h1 className="text-3xl text-blue-100 font-bold mb-8">Payments</h1>
      {/* Summary Cards */}
      <div
        className="grid gap-6 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        {/* Total Balance - Green */}
        <div
          className={`${glassCardClass} bg-gradient-to-br from-green-900 to-green-800 border-green-500`}
        >
          <div>
            <p className="text-sm opacity-70 mb-2 text-green-300">
              Total Balance
            </p>
            <h2 className="text-3xl font-bold text-white">
              ${totalBalance.toFixed(2)}
            </h2>
          </div>
          <div
            className={`${iconWrapperClass} bg-gradient-to-br from-green-600 to-green-900 text-green-400 border-green-400 border`}
            aria-label="Total Balance icon"
          >
            <PiggyBank size={24} />
          </div>
        </div>

        {/* Total Withdrawals - Blue */}
        <div
          className={`${glassCardClass} bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500`}
        >
          <div>
            <p className="text-sm opacity-70 mb-2 text-blue-300">
              Total Withdrawals
            </p>
            <h2 className="text-3xl font-bold text-white">
              ${totalWithdrawals.toFixed(2)}
            </h2>
          </div>
          <div
            className={`${iconWrapperClass} bg-gradient-to-br from-blue-600 to-blue-900 text-blue-400 border-blue-400 border`}
            aria-label="Total Withdrawals icon"
          >
            <LogOut size={24} />
          </div>
        </div>

        {/* Transferred Amount - Teal */}
        <div
          className={`${glassCardClass} bg-gradient-to-br from-teal-900 to-teal-800 border-teal-500`}
        >
          <div>
            <p className="text-sm opacity-70 mb-2 text-teal-300">
              Transferred Amount
            </p>
            <h2 className="text-3xl font-bold text-white">
              ${totalTransferredAmount.toFixed(2)}
            </h2>
          </div>
          <div
            className={`${iconWrapperClass} bg-gradient-to-br from-teal-600 to-teal-900 text-teal-400 border-teal-400 border`}
            aria-label="Transferred Amount icon"
          >
            <DollarSign size={24} />
          </div>
        </div>

        {/* Hold Balance - Yellow */}
        <div
          className={`${glassCardClass} bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-500`}
        >
          <div>
            <p className="text-sm opacity-70 mb-2 text-yellow-300">
              Hold Balance
            </p>
            <h2 className="text-3xl font-bold text-white">
              ${holdBalance.toFixed(2)}
            </h2>
          </div>
          <div
            className={`${iconWrapperClass} bg-gradient-to-br from-yellow-600 to-yellow-900 text-yellow-400 border-yellow-400 border`}
            aria-label="Hold Balance icon"
          >
            <PauseCircle size={24} />
          </div>
        </div>

        {/* Rejected Balance - Red */}
        <div
          className={`${glassCardClass} bg-gradient-to-br from-red-900 to-red-800 border-red-500`}
        >
          <div>
            <p className="text-sm opacity-70 mb-2 text-red-400">
              Rejected Balance
            </p>
            <h2 className="text-3xl font-bold text-white">
              ${rejectedBalance.toFixed(2)}
            </h2>
          </div>
          <div
            className={`${iconWrapperClass} bg-gradient-to-br from-red-600 to-red-900 text-red-400 border-red-400 border`}
            aria-label="Rejected Balance icon"
          >
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filters Toggle & Clear */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 rounded-lg hover:bg-blue-800 text-white transition duration-300 ease-in-out"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters &&
          (startDate || endDate || walletFilter || networkFilter) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 text-white transition duration-300 ease-in-out"
            >
              Clear Filters
            </button>
          )}
      </div>
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-blue-900 rounded-lg p-6 shadow mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Start Date */}
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label htmlFor="start-date" className="mb-1 font-medium">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate ? startDate.toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label htmlFor="end-date" className="mb-1 font-medium">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate ? endDate.toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
              />
            </div>

            {/* Wallet */}
            <div className="flex flex-col flex-1 min-w-[150px] relative">
              <label htmlFor="wallet" className="mb-1 font-medium">
                Wallet
              </label>
              <div className="relative">
                <input
                  id="wallet"
                  type="text"
                  placeholder="Search wallet"
                  value={walletFilter}
                  onChange={(e) => setWalletFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
                />
                <Search
                  size={18}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Network */}
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label htmlFor="network" className="mb-1 font-medium">
                Network
              </label>
              <select
                id="network"
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">All Networks</option>
                {networksList.map((network) => (
                  <option key={network._id} value={network._id}>
                    {network.Network}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {/* Loading/Error */}
      {loadingWithdrawals && (
        <div className="text-center text-blue-300 mb-4">
          Loading withdrawals...
        </div>
      )}
      {withdrawalsError && (
        <div className="text-center text-red-500 mb-4">{withdrawalsError}</div>
      )}
      {/* TABLE FOR DESKTOP & ABOVE */}
      <div className="bg-blue-900 rounded-lg p-4 shadow-md overflow-auto hidden sm:block">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-blue-700">
              <th className="text-center p-3 cursor-pointer">Date</th>
              <th className="text-left p-3 break-all">Wallet</th>
              <th className="text-center p-3">Network</th>
              <th className="text-center p-3">Amount</th>
              <th className="text-center p-3">Fee</th>
              <th className="text-center p-3">Amount Sent</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filteredWithdrawals.length === 0 && !loadingWithdrawals && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-blue-300">
                  No withdrawals found.
                </td>
              </tr>
            )}
            {filteredWithdrawals.map((row) => (
              <tr
                key={row._id}
                className="border-b border-blue-800 hover:bg-blue-800"
              >
                <td className="p-3 text-center">{formatDate(row.createdAt)}</td>
                <td className="p-3 break-all text-left">
                  <button
                    onClick={() => copyToClipboard(row.WalletAddress)}
                    className="cursor-pointer focus:outline-none"
                    title="Click to copy full wallet address"
                  >
                    <span className="hidden sm:inline">
                      {row.WalletAddress}
                    </span>
                    <span className="inline sm:hidden">
                      {shortenWallet(row.WalletAddress)}
                    </span>
                  </button>
                </td>
                <td className="p-3 text-center">
                  {row.NetworkId?.Network || ""}
                </td>
                <td className="p-3 text-center">
                  ${(row.AmountInUSD + (row.FeeInUSD || 0)).toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  ${(row.FeeInUSD || 0).toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  ${(row.AmountInUSD || 0).toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(
                      row.Status
                    )}`}
                  >
                    {row.Status}
                  </span>
                </td>
                <td className="p-3 cursor-pointer flex justify-center items-center">
                  <button
                    onClick={() => handleDownloadReceipt(row)}
                    aria-label="Download receipt"
                  >
                    <FileText size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {filteredWithdrawals.length > 0 && (
            <tfoot>
              <tr className="bg-blue-800 text-white font-semibold border-t border-blue-700">
                <td className="p-3 text-center">Total</td>
                <td className="p-3"></td>
                <td className="p-3 text-center"></td>
                <td className="p-3 text-center">
                  $
                  {filteredWithdrawals
                    .reduce(
                      (sum, w) =>
                        sum + (w.AmountInUSD || 0) + (w.FeeInUSD || 0),
                      0
                    )
                    .toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  $
                  {filteredWithdrawals
                    .reduce((sum, w) => sum + (w.FeeInUSD || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  $
                  {filteredWithdrawals
                    .reduce((sum, w) => sum + (w.AmountInUSD || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="p-3 text-center"></td>
                <td className="p-3 text-center"></td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Pagination controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          {/* Show Rows selector */}
          <div className="flex items-center gap-2 text-white">
            <label htmlFor="rowsPerPage" className="text-blue-300">
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
                  page: 1, // reset to page 1 when changing rows
                }));
              }}
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {/* Pagination buttons: Prev, page numbers, Last */}
          <div className="flex flex-wrap justify-center gap-2 text-white">
            {/* Prev button */}
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
            >
              {"< Prev"}
            </button>

            {/* Page numbers with dots */}
            {getPaginationPages(pagination.page, pagination.totalPages).map(
              (pageNum, idx) =>
                pageNum === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="px-2 py-1 text-blue-300 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: pageNum }))
                    }
                    className={`px-3 py-1 rounded transition ${
                      pageNum === pagination.page
                        ? "bg-blue-600 text-white"
                        : "bg-blue-800 text-blue-300 hover:bg-blue-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
            )}

            {/* Last button */}
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: pagination.totalPages }))
              }
              disabled={pagination.page === pagination.totalPages}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
            >
              {"Last >"}
            </button>
          </div>
        </div>
      </div>
      {/* MOBILE VIEW */}
      <div className="sm:hidden space-y-6">
        {filteredWithdrawals.length === 0 && !loadingWithdrawals && (
          <div className="text-center text-blue-300">No withdrawals found.</div>
        )}
        {filteredWithdrawals.map((row) => (
          <div
            key={row._id}
            className="bg-blue-900 rounded-lg p-4 shadow hover:bg-blue-800 transition"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="font-semibold text-lg">
                {formatDate(row.createdAt)}
              </span>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(
                  row.Status
                )}`}
              >
                {row.Status}
              </span>
            </div>

            <div className="space-y-4">
              {/* Wallet */}
              <div className="flex flex-col">
                <span className="text-blue-400 font-semibold mb-1">
                  Wallet:
                </span>
                <button
                  onClick={() => copyToClipboard(row.WalletAddress)}
                  className="break-words cursor-pointer text-white"
                  title="Click to copy full wallet address"
                >
                  {row.WalletAddress}
                </button>
              </div>

              {/* Network + Fee */}
              <div className="flex gap-6">
                <div className="flex-1 flex flex-col">
                  <span className="text-blue-400 font-semibold mb-1">
                    Network:
                  </span>
                  <span>{row.NetworkId?.Network || ""}</span>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-blue-400 font-semibold mb-1">Fee:</span>
                  <span>${(row.FeeInUSD || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Amount + Amount Sent */}
              <div className="flex gap-6">
                <div className="flex-1 flex flex-col">
                  <span className="text-blue-400 font-semibold mb-1">
                    Amount:
                  </span>
                  <span>
                    ${(row.AmountInUSD + (row.FeeInUSD || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-blue-400 font-semibold mb-1">
                    Amount Sent:
                  </span>
                  <span>${(row.AmountInUSD || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Receipt button full width */}
              <button
                type="button"
                onClick={() => handleDownloadReceipt(row)}
                className="mt-3 w-full inline-flex items-center gap-2 px-4 py-2 bg-blue-700 rounded-md hover:bg-blue-600 transition text-white justify-center"
              >
                <FileText size={20} />
                Receipt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
