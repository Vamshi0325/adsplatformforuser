"use client";

import React, { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { authHandlers } from "@/services/api-handlers";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function StatisticsPage() {
  const searchParams = useSearchParams();
  const websiteIdFromQuery = searchParams.get("website_id");

  // Filters visibility toggle
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Data & loading
  const [statisticsData, setStatisticsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    limit: 10,
    totalPages: 1,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  });

  // Filters state
  const [filterWebsiteName, setFilterWebsiteName] = useState("");
  const [matchedWebsiteId, setMatchedWebsiteId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Format ISO date to DD-MM-YY
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Format Date object to YYYY-MM-DD for API
  const formatDateForAPI = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime()))
      return undefined;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Pagination pages generator with dots
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

  // Fetch stats from API
  const fetchStats = async (
    page = 1,
    websiteId = matchedWebsiteId || websiteIdFromQuery
  ) => {
    setLoading(true);
    try {
      const startDateParam = formatDateForAPI(startDate);
      const endDateParam = formatDateForAPI(endDate);

      console.log(
        "startDateParam:",
        startDateParam,
        "endDateParam:",
        endDateParam
      );

      const response = await authHandlers.getUserStats({
        page,
        limit: pagination.limit,
        startDate: startDateParam,
        endDate: endDateParam,
        website_id: websiteId,
      });

      if (response?.status === 200) {
        const userstats = response.data.userstats;

        console.log("userstats:", userstats.docs);

        setStatisticsData(userstats.docs || []);
        setPagination((prev) => ({
          totalDocs: userstats.totalDocs || 0,
          limit: userstats.limit || 10,
          totalPages: userstats.totalPages || 1,
          page: userstats.page || 1,
          hasPrevPage: userstats.hasPrevPage || false,
          hasNextPage: userstats.hasNextPage || false,
          prevPage: userstats.prevPage || null,
          nextPage: userstats.nextPage || null,
        }));
      } else {
        setStatisticsData([]);
        setPagination((prev) => ({
          ...prev,
          totalDocs: 0,
          totalPages: 1,
          page: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      toast.error("Failed to load statistics.");
      setStatisticsData([]);
      setPagination({
        totalDocs: 0,
        limit: 10,
        totalPages: 1,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      });
    } finally {
      setLoading(false);
    }
  };

  // Find matchedWebsiteId from filterWebsiteName input & existing data
  useEffect(() => {
    if (!filterWebsiteName.trim()) {
      setMatchedWebsiteId("");
      return;
    }

    const matched = statisticsData.find((item) =>
      item.website_id?.WebsiteName?.toLowerCase().includes(
        filterWebsiteName.toLowerCase()
      )
    );

    setMatchedWebsiteId(matched?.website_id?._id || "");
  }, [filterWebsiteName, statisticsData]);

  // Fetch stats on page, limit, matchedWebsiteId changes
  useEffect(() => {
    fetchStats(pagination.page);
  }, [pagination.page, pagination.limit, matchedWebsiteId, websiteIdFromQuery]);

  // Fetch stats when both dates are set or cleared, reset page to 1
  useEffect(() => {
    if ((startDate && endDate) || (!startDate && !endDate)) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchStats(1);
    }
  }, [startDate, endDate]);

  // Clear all filters including websiteName & dates
  const clearFilters = () => {
    setFilterWebsiteName("");
    setStartDate(null);
    setEndDate(null);
    setMatchedWebsiteId("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Pagination controls
  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  const noData = statisticsData.length === 0;
  const anyFilterActive =
    filterWebsiteName.trim() !== "" || startDate !== null || endDate !== null;

  return (
    <div>
      {/* Header & Filter toggles */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-blue-100">Statistics</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 rounded-lg hover:bg-blue-800 text-white transition duration-300 ease-in-out"
          >
            <Filter className="w-5 h-5" />
            {filtersVisible ? "Hide Filters" : "Show Filters"}
          </button>

          {filtersVisible && anyFilterActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 text-white transition duration-300 ease-in-out"
            >
              <X className="w-5 h-5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {filtersVisible && (
        <div className="mb-6 bg-blue-900 rounded-lg p-4 shadow text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label htmlFor="start-date" className="mb-1 font-medium">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={
                  startDate ? startDate.toISOString().substring(0, 10) : ""
                }
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
              />
            </div>

            <div className="flex flex-col flex-1 min-w-[150px]">
              <label htmlFor="end-date" className="mb-1 font-medium">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
              />
            </div>

            <div className="flex flex-col flex-1 min-w-[150px]">
              <label htmlFor="website-name" className="mb-1 font-medium">
                Website Name
              </label>
              <input
                id="website-name"
                type="text"
                placeholder="Search Website Name"
                value={filterWebsiteName}
                onChange={(e) => setFilterWebsiteName(e.target.value)}
                className="px-4 py-3 rounded-md bg-blue-800 border border-blue-700 placeholder-blue-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-white text-center py-10">
          Loading statistics...
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-blue-900 rounded-lg p-4 shadow-md text-white overflow-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-b border-blue-700">
                  <th className="text-center p-3">Date</th>
                  <th className="text-center p-3">Website Name</th>
                  <th className="text-center p-3">Impressions</th>
                  <th className="text-center p-3">CPM</th>
                  <th className="text-center p-3">Profit</th>
                </tr>
              </thead>
              <tbody>
                {noData ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-blue-300">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  statisticsData.map((item) => (
                    <tr
                      key={item._id || item.id}
                      className="border-b border-blue-800 hover:bg-blue-800"
                    >
                      <td className="p-3 text-center align-middle">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="p-3 text-center align-middle">
                        {item.website_id?.WebsiteName || "Unknown"}
                      </td>
                      <td className="p-3 text-center align-middle">
                        {(item.impressions || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center align-middle">
                        {(item.CPM || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center align-middle">
                        ${" "}
                        {(item.Profit || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Table with headers on left, data on right */}
          <div className="sm:hidden space-y-4">
            {noData ? (
              <div className="text-center p-6 text-blue-300 rounded-lg bg-blue-900">
                No data found.
              </div>
            ) : (
              statisticsData.map((item) => (
                <div
                  key={item._id || item.id}
                  className="bg-blue-800 rounded-lg p-4 shadow hover:bg-blue-700 transition text-white"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-semibold text-right pr-4 border-r border-blue-700 select-none">
                      Date
                    </div>
                    <div>{formatDate(item.createdAt)}</div>

                    <div className="font-semibold text-right pr-4 border-r border-blue-700 select-none">
                      Website Name
                    </div>
                    <div>{item.website_id?.WebsiteName || "Unknown"}</div>

                    <div className="font-semibold text-right pr-4 border-r border-blue-700 select-none">
                      Impressions
                    </div>
                    <div>{(item.impressions || 0).toLocaleString()}</div>

                    <div className="font-semibold text-right pr-4 border-r border-blue-700 select-none">
                      CPM
                    </div>
                    <div>{(item.CPM || 0).toFixed(2)}</div>

                    <div className="font-semibold text-right pr-4 border-r border-blue-700 select-none">
                      Profit
                    </div>
                    <div>
                      ${" "}
                      {(item.Profit || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-white gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="rowsPerPage" className="text-blue-300">
                Show rows
              </label>
              <select
                id="rowsPerPage"
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setPagination((prev) => ({
                    ...prev,
                    limit: newLimit,
                    page: 1,
                  }));
                }}
                className="bg-blue-800 border border-blue-700 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Prev Page */}
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-blue-800 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              {/* Dynamic page numbers */}
              {getPaginationPages(pagination.page, pagination.totalPages).map(
                (pageNum, idx) =>
                  pageNum === "..." ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-3 py-1 text-blue-400 select-none"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded-md hover:bg-blue-700 ${
                        pageNum === pagination.page
                          ? "bg-blue-600 font-bold"
                          : "bg-blue-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
              )}

              {/* Last Page */}
              <button
                onClick={() => goToPage(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 bg-blue-800 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
