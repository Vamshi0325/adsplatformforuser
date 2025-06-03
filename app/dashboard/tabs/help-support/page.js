"use client";

import { FaTelegram } from "react-icons/fa";
import { RiMailSendLine } from "react-icons/ri";
import { AiOutlineMinusSquare, AiOutlinePlusSquare } from "react-icons/ai";
import { useEffect, useState } from "react";
import { authHandlers } from "@/services/api-handlers";

export default function HelpSupport() {
  const [openFaqId, setOpenFaqId] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  // Inputs state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [faqs, setFaqs] = useState([]);
  const [telegramLink, setTelegramLink] = useState("");

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const getSupportData = async () => {
    try {
      const response = await authHandlers.getSupportData();
      // console.log("getSupportData response:", response.data);

      if (response && response.data && response.data.Supportdata) {
        const activeFaqs = response.data.Supportdata.FAQS.filter(
          (faq) => faq.isFAqActive === true
        );

        setFaqs(activeFaqs);
        setTelegramLink(response.data.Supportdata.TelegramSupport);
      } else {
        setFaqs([]);
      }
    } catch (error) {
      setFaqs([]);
    }
  };

  useEffect(() => {
    getSupportData();
  }, []);

  const handleSubmitRequest = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    if (!subject.trim()) {
      setSubmitError("Please enter a subject.");
      return;
    }
    if (!message.trim()) {
      setSubmitError("Please enter a message.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass two strings exactly — subject and message
      const res = await authHandlers.supportMail(
        subject.trim(),
        message.trim()
      );

      console.log("res:", res);

      if (res && res.status === 200) {
        setSubmitSuccess("Request sent successfully!");
        setSubject("");
        setMessage("");
      } else {
        setSubmitError("Failed to send request. Please try again.");
      }
    } catch (error) {
      console.log("error:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Error sending request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-white max-w-[90vw] mx-auto">
      <h1 className="text-3xl text-blue-100 font-bold mb-8">
        Help &amp; Support
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Contact Support Card */}
        <div className="flex-1 bg-blue-900 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-2">Contact Support</h2>
          <p className="text-blue-300 mb-6">Get help from our support team</p>

          <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4">
            <div>
              <label htmlFor="subject" className="block mb-1 font-semibold">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label htmlFor="message" className="block mb-1 font-semibold">
                Message
              </label>
              <textarea
                id="message"
                placeholder="Describe your issue..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold transition"
            >
              <RiMailSendLine size={18} />
              {isSubmitting ? "Sending..." : "Submit Request"}
            </button>

            <button
              type="button"
              onClick={() => window.open(telegramLink, "_blank")}
              disabled={!telegramLink}
              className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-900 px-6 py-3 rounded-lg text-white font-semibold transition mt-2"
            >
              <FaTelegram size={20} />
              Contact via Telegram
            </button>

            {submitError && (
              <p className="text-red-400 text-sm mt-3">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-green-400 text-sm mt-3">{submitSuccess}</p>
            )}
          </form>
        </div>

        {/* FAQs Card */}
        <div className="flex-1 bg-blue-900 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-6">FAQs</h2>

          <div className="divide-y divide-blue-700">
            {faqs.length > 0 ? (
              faqs.map((faq, index) => (
                <div
                  key={faq._id}
                  className="py-4 cursor-pointer"
                  onClick={() => toggleFaq(faq._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white font-semibold text-lg gap-3">
                      <AiOutlinePlusSquare
                        size={22}
                        className={`transition-transform ${
                          openFaqId === faq._id ? "rotate-45" : ""
                        }`}
                      />
                      <span>{faq.FAQ}</span>
                    </div>
                  </div>
                  {openFaqId === faq._id && (
                    <p className="mt-3 text-blue-300 pl-8 max-w-[95%]">
                      {faq.Answer}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="py-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white font-semibold text-lg gap-3">
                    <AiOutlinePlusSquare size={22} />
                    <span>No FAQs available.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
