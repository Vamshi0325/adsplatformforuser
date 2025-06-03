"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter, X, BarChart2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authHandlers } from "@/services/api-handlers";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import { useAuth } from "@/context/auth-context"; // Adjust import to your auth context
import VerifyEmailCard from "@/components/verify-email";

export default function MySitesPage() {
  const router = useRouter();
  const { user, refreshUserData } = useAuth(); // grab user & refreshUserData from auth context

  // === Your existing states ===
  const [sites, setSites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'true', 'false'
  const [date, setDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [formData, setFormData] = useState({
    WebsiteName: "",
    WebsiteURL: "",
    WebAPPUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const isMobile = useMediaQuery({ maxWidth: 768 });

  // === Email Verification states ===
  const userEmail = user?.userdata?.Email || ""; // get email from user context
  const [verificationStep, setVerificationStep] = useState("email"); // 'email' or 'otp'
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
  const otpRefs = useRef([]);

  // === Email Verification timer effect ===
  useEffect(() => {
    let interval;
    if (verificationStep === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [verificationStep, timer]);

  // === OTP input handlers ===
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return; // only accept exactly 6 digits

    const newOtp = pasteData.split("");
    setOtp(newOtp);

    // Focus last input after paste
    otpRefs.current[5]?.focus();
  };

  // === Send OTP ===
  const handleVerifyEmail = async () => {
    if (!userEmail) return;
    setIsSendingOtp(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await authHandlers.sendOTP(userEmail);
      if (res && res.status === 200) {
        const expiresAtTime = new Date(res.data.expiresAt).getTime();
        const now = Date.now();
        let secondsRemaining = Math.floor((expiresAtTime - now) / 1000);
        if (secondsRemaining < 0) secondsRemaining = 0;

        setVerificationStep("otp");
        setTimer(secondsRemaining);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        setVerificationSuccess(res.data.message);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      } else {
        setVerificationError("Failed to send OTP");
      }
    } catch (err) {
      setVerificationError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // === Verify OTP ===
  const handleVerifyOtp = async () => {
    if (otp.join("").length !== 6) {
      setVerificationError("Please enter complete OTP");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await authHandlers.verifyOTPWithVerificationFlag(
        userEmail,
        otp.join("")
      );
      if (res && res.status === 200) {
        setVerificationSuccess(res.data.message);
        await refreshUserData(); // update user state
        // Close modal automatically after success
        setTimeout(() => {
          setVerificationStep("email");
          setVerificationSuccess("");
          setOtp(["", "", "", "", "", ""]);
        }, 2000);
      } else {
        setVerificationError(res.error || "Invalid OTP");
      }
    } catch (error) {
      setVerificationError(
        error.response?.data?.message || "Failed to verify OTP"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // === Resend OTP ===
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsSendingOtp(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await authHandlers.sendOTP(userEmail);
      if (res && res.status === 200) {
        const expiresAtTime = new Date(res.data.expiresAt).getTime();
        const now = Date.now();
        let secondsRemaining = Math.floor((expiresAtTime - now) / 1000);
        if (secondsRemaining < 0) secondsRemaining = 0;

        setTimer(secondsRemaining);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        setVerificationSuccess(res.data.message);

        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);

        setTimeout(() => setVerificationSuccess(""), 3000);
      } else {
        setVerificationError(res.error);
      }
    } catch (error) {
      setVerificationError(
        error.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  // === Back to email step ===
  const handleBackToEmail = () => {
    setVerificationStep("email");
    setVerificationError("");
    setVerificationSuccess("");
    setOtp(["", "", "", "", "", ""]);
    setTimer(0);
    setCanResend(true);
  };

  // === Your existing helpers & fetchSites, handlers, form logic ... (keep them unchanged) ===
  // formatDateForAPI, formatCreatedAtUTC, fetchSites, pagination, form validation, handleSubmit, etc.

  // formatDateForAPI & formatCreatedAtUTC (unchanged)
  const formatDateForAPI = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return undefined;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatCreatedAtUTC = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = String(d.getUTCFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  // fetchSites function unchanged but added here for clarity
  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: Number(rowsPerPage),
      };

      if (searchQuery.trim() !== "") {
        params.WebsiteName = searchQuery.trim();
      }
      if (date) {
        params.createdAt = formatDateForAPI(date);
      }
      if (statusFilter === "true") {
        params.isActive = true;
      } else if (statusFilter === "false") {
        params.isActive = false;
      }

      const result = await authHandlers.getUserWebsites(params);

      if (result && result.status === 200) {
        setSites(result.data.usersites.docs || []);
        setTotalPages(result.data.usersites.totalPages || 1);
      } else {
        setSites([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError("Failed to load sites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [page, rowsPerPage, searchQuery, date, statusFilter]);

  // status styles and label (unchanged)
  const statusStyles = {
    false: "bg-yellow-400 text-yellow-900",
    true: "bg-green-500 text-green-100",
  };
  const statusLabel = (isActive) => (isActive ? "Active" : "Inactive");

  // Pagination Helper to generate pages with ellipsis (unchanged)
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

  // === Form handlers & validation (unchanged, but renaming errors to formErrors for clarity) ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.WebsiteName.trim())
      newErrors.WebsiteName = "Website Name is required";
    if (!formData.WebsiteURL.trim())
      newErrors.WebsiteURL = "Website URL is required";
    else if (!formData.WebsiteURL.startsWith("https://"))
      newErrors.WebsiteURL = "URL must start with https://";
    if (!formData.WebAPPUrl.trim())
      newErrors.WebAPPUrl = "Web APP URL is required";
    else if (!formData.WebAPPUrl.startsWith("https://t.me/"))
      newErrors.WebAPPUrl = "URL must start with https://t.me/";
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await authHandlers.createAppRequest(formData);

      if (result && result.status === 201) {
        toast.success(result.data.message || "App created successfully!");
        setIsAddSiteModalOpen(false);
        setFormData({ WebsiteName: "", WebsiteURL: "", WebAPPUrl: "" });
        setFormErrors({});
        fetchSites(); // refresh list
      }
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error(error.response.data.message || "Conflict error");
      } else {
        toast.error(error?.response?.data?.message || "Failed to create app");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Main render ===
  return (
    <>
      {/* If user email NOT verified, show email verification modal overlay */}
      {!user?.userdata?.isEmailVerified && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-75 p-4">
          <VerifyEmailCard>
            <h2 className="text-[2.2em] font-bold bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent text-center mb-4">
              Verify Your Email
            </h2>

            {verificationStep === "email" && (
              <>
                <p className="mb-4 text-center text-purple-100/90">
                  Your email: <strong>{userEmail}</strong>
                </p>
                {verificationError && (
                  <p className="mb-4 text-red-500 text-center">
                    {verificationError}
                  </p>
                )}
                {verificationSuccess && (
                  <p className="mb-4 text-green-500 text-center">
                    {verificationSuccess}
                  </p>
                )}
                <button
                  onClick={handleVerifyEmail}
                  disabled={isSendingOtp}
                  className="relative h-fit w-full px-[1.4em] py-[0.7em] mt-2 border-[1px] border-purple-300/30 rounded-full flex justify-center items-center gap-[0.7em] overflow-hidden group/btn hover:border-purple-300/50 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all duration-300 backdrop-blur-[12px] bg-purple-500/10 text-white font-medium tracking-wide"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-fuchsia-500/40 to-purple-600/40 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 rounded-full" />
                  <p className="relative z-10">
                    {isSendingOtp ? "Sending OTP..." : "Send OTP"}
                  </p>
                </button>
              </>
            )}

            {verificationStep === "otp" && (
              <>
                <p className="mb-2 text-center text-purple-100/90">
                  Enter the 6-digit code sent to{" "}
                  <strong>
                    {userEmail.slice(0, 3)}****{userEmail.slice(-3)}
                  </strong>
                </p>
                <div className="flex justify-center gap-2 mb-4">
                  {[...Array(6)].map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={otp[idx]}
                      onChange={(e) => handleOTPChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(idx, e)}
                      onPaste={handlePaste}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      className="w-10 h-12 text-center rounded-md bg-[rgba(75,30,133,0.7)] border border-purple-700 text-white font-mono text-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ))}
                </div>
                {verificationError && (
                  <p className="mb-4 text-red-500 text-center">
                    {verificationError}
                  </p>
                )}
                {verificationSuccess && (
                  <p className="mb-4 text-green-500 text-center">
                    {verificationSuccess}
                  </p>
                )}
                <div className="flex justify-between items-center mb-4 text-sm text-purple-200">
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-purple-300 hover:text-purple-400 transition disabled:opacity-50"
                    disabled={isVerifying || isSendingOtp}
                  >
                    Back to email verification
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isSendingOtp || isVerifying}
                    className={`text-purple-300 hover:text-purple-400 transition ${
                      !canResend ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Resend OTP {timer > 0 && `(${timer}s)`}
                  </button>
                </div>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || isSendingOtp}
                  className="relative h-fit w-full px-[1.4em] py-[0.7em] mt-2 border-[1px] border-purple-300/30 rounded-full flex justify-center items-center gap-[0.7em] overflow-hidden group/btn hover:border-purple-300/50 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all duration-300 backdrop-blur-[12px] bg-purple-500/10 text-white font-medium tracking-wide"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-fuchsia-500/40 to-purple-600/40 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 rounded-full" />
                  <p className="relative z-10">
                    {isVerifying ? "Verifying..." : "Verify OTP"}
                  </p>
                </button>
              </>
            )}
          </VerifyEmailCard>
        </div>
      )}

      {/* ======= Your existing page content below (header, filters, tables, modals) ======= */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold text-blue-100">My Sites</h1>
        <button
          type="button"
          onClick={() => setIsAddSiteModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg"
          style={{
            backgroundImage:
              "linear-gradient(to right, #1FA2FF 0%, #12D8FA  51%, #1FA2FF  100%)",
            textAlign: "center",
            textTransform: "uppercase",
            transition: "0.5s",
            backgroundSize: "200% auto",
            color: "white",
            borderRadius: "10px",
          }}
          onMouseOver={(e) =>
            (e.target.style.backgroundPosition = "right center")
          }
          onMouseOut={(e) =>
            (e.target.style.backgroundPosition = "left center")
          }
        >
          <Plus className="w-5 h-5" />
          Create App
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by App Name"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-blue-900 border border-blue-800
                       placeholder-blue-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-blue-500 transition"
          />
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-900 rounded-lg
                     hover:bg-blue-800 text-white transition duration-300 ease-in-out"
        >
          <Filter className="w-5 h-5" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {(searchQuery || date || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setDate(null);
              setStatusFilter("all");
              setPage(1);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-800 rounded-lg
                       hover:bg-blue-700 text-white transition duration-300 ease-in-out"
          >
            <X className="w-5 h-5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-blue-900 rounded-lg p-4 text-white shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col flex-1">
              <label className="mb-2 font-medium" htmlFor="filter-date">
                Filter by Date
              </label>
              <DatePicker
                id="filter-date"
                selected={date}
                onChange={(val) => {
                  setDate(val);
                  setPage(1);
                }}
                dateFormat="dd-MM-yyyy"
                placeholderText="Select a date"
                className="px-4 py-2 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white w-full"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="mb-2 font-medium" htmlFor="filter-status">
                Filter by Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 rounded-md bg-blue-800 border border-blue-700 text-white placeholder-blue-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full"
              >
                <option value="all">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-600 text-white rounded">{error}</div>
      )}

      {/* Loading / Table or Cards */}
      {loading ? (
        <div className="text-white text-center py-10">Loading sites...</div>
      ) : isMobile ? (
        <div className="space-y-6">
          {sites.length === 0 ? (
            <div className="text-center p-6 text-blue-300">No sites found.</div>
          ) : (
            sites.map((item) => (
              <div
                key={item._id}
                className="bg-blue-900 rounded-lg p-6 shadow-md text-white leading-relaxed"
              >
                <h3 className="text-xl font-semibold mb-4">
                  {item.WebsiteName}
                </h3>
                <p className="mb-3">
                  <span className="font-semibold">Web App Link:</span>{" "}
                  <a
                    href={item.WebAPPUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline break-words"
                  >
                    {item.WebAPPUrl}
                  </a>
                </p>
                <p className="mb-3">
                  <span className="font-semibold">Website URL:</span>{" "}
                  <a
                    href={item.WebsiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline break-words"
                  >
                    {item.WebsiteURL}
                  </a>
                </p>
                <p className="mb-3">
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      statusStyles[String(item.isActive)] ||
                      "bg-red-600 text-white"
                    }`}
                  >
                    {statusLabel(item.isActive)}
                  </span>
                </p>
                <p className="mb-3">
                  <span className="font-semibold">Created At:</span>{" "}
                  {formatCreatedAtUTC(item.createdAt)}
                </p>
                <button
                  type="button"
                  className="mt-4 w-full bg-blue-700 hover:bg-blue-600 text-white px-4 py-3 rounded-md transition flex items-center justify-center gap-2"
                  onClick={() =>
                    router.push(
                      `/dashboard/tabs/statistics?website_id=${item._id}`
                    )
                  }
                >
                  <BarChart2 className="w-5 h-5" />
                  Stats
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-blue-900 rounded-lg p-4 text-white shadow-md overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-blue-700 text-center">
                <th className="p-3">App Name</th>
                <th className="p-3">Web App Link</th>
                <th className="p-3">Website URL</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created At</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-blue-300">
                    No sites found.
                  </td>
                </tr>
              ) : (
                sites.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-blue-800 hover:bg-blue-800 text-center"
                  >
                    <td className="p-3">{item.WebsiteName}</td>
                    <td className="p-3 break-all">
                      <a
                        href={item.WebAPPUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-block"
                      >
                        {item.WebAPPUrl}
                      </a>
                    </td>
                    <td className="p-3 break-all">
                      <a
                        href={item.WebsiteURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-block"
                      >
                        {item.WebsiteURL}
                      </a>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-center w-20 ${
                          statusStyles[String(item.isActive)] ||
                          "bg-red-600 text-white"
                        }`}
                      >
                        {statusLabel(item.isActive)}
                      </span>
                    </td>
                    <td className="p-3">
                      {formatCreatedAtUTC(item.createdAt)}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-700 rounded-md hover:bg-blue-600 transition text-white mx-auto"
                        onClick={() =>
                          router.push(
                            `/dashboard/tabs/statistics?website_id=${item._id}`
                          )
                        }
                      >
                        <BarChart2 className="w-4 h-4" />
                        Stats
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-white gap-4">
          <div className="flex items-center gap-2">
            <span>Show rows</span>
            <select
              className="bg-blue-800 border border-blue-700 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(e.target.value);
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end max-w-full overflow-x-auto">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
            >
              {"<<"}
            </button>

            {getPaginationPages(page, totalPages).map((item, idx) =>
              item === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="px-3 py-1 select-none text-white cursor-default"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`px-3 py-1 rounded transition ${
                    item === page
                      ? "bg-blue-500 font-bold"
                      : "bg-blue-800 hover:bg-blue-700"
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 transition"
            >
              {">>"}
            </button>
          </div>
        </div>
      )}

      {/* Add Site Modal */}
      {/* Add Site Modal */}
      {isAddSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div
            className="absolute inset-0"
            onClick={() => setIsAddSiteModalOpen(false)}
          />

          <form
            onSubmit={handleSubmit}
            className="relative bg-gradient-to-br from-[rgba(75,30,133,0.9)] via-purple-800 to-purple-900 rounded-[1.5em] p-8 w-full max-w-md
                 shadow-2xl text-white backdrop-blur-[12px] border border-purple-600 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent text-center">
              Create App
            </h2>

            {/* Website Name */}
            <label
              className="block mb-2 font-semibold text-purple-300"
              htmlFor="WebsiteName"
            >
              Website Name <span className="text-red-500">*</span>
            </label>
            <input
              id="WebsiteName"
              name="WebsiteName"
              type="text"
              placeholder="Website Name"
              value={formData.WebsiteName}
              onChange={handleChange}
              className="w-full mb-5 px-5 py-3 rounded-full bg-[rgba(75,30,133,0.7)] border border-purple-700
                   placeholder-purple-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                   transition"
            />
            {formErrors.WebsiteName && (
              <p className="text-red-400 text-sm mb-4">
                {formErrors.WebsiteName}
              </p>
            )}

            {/* Website URL */}
            <label
              className="block mb-2 font-semibold text-purple-300"
              htmlFor="WebsiteURL"
            >
              Website URL <span className="text-red-500">*</span>
            </label>
            <input
              id="WebsiteURL"
              name="WebsiteURL"
              type="text"
              placeholder="https://example.com"
              value={formData.WebsiteURL}
              onChange={handleChange}
              className="w-full mb-5 px-5 py-3 rounded-full bg-[rgba(75,30,133,0.7)] border border-purple-700
                   placeholder-purple-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                   transition"
            />
            {formErrors.WebsiteURL && (
              <p className="text-red-400 text-sm mb-4">
                {formErrors.WebsiteURL}
              </p>
            )}

            {/* Web APP URL */}
            <label
              className="block mb-2 font-semibold text-purple-300"
              htmlFor="WebAPPUrl"
            >
              Web APP URL <span className="text-red-500">*</span>
            </label>
            <input
              id="WebAPPUrl"
              name="WebAPPUrl"
              type="text"
              placeholder="https://t.me/your_bot"
              value={formData.WebAPPUrl}
              onChange={handleChange}
              className="w-full mb-6 px-5 py-3 rounded-full bg-[rgba(75,30,133,0.7)] border border-purple-700
                   placeholder-purple-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                   transition"
            />
            {formErrors.WebAPPUrl && (
              <p className="text-red-400 text-sm mb-4">
                {formErrors.WebAPPUrl}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-5">
              <button
                type="button"
                onClick={() => setIsAddSiteModalOpen(false)}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-full bg-purple-800 hover:bg-purple-700 transition text-purple-300 font-semibold
                     active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600
                     text-white font-semibold tracking-wide overflow-hidden transition
                     hover:shadow-lg hover:shadow-purple-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create App"}
                <span
                  className="absolute inset-0 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 opacity-0
                           group-hover:opacity-100 transition-opacity rounded-full"
                />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
