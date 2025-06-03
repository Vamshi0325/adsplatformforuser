"use client";

import { useState } from "react";
import { Save, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import { authHandlers } from "@/services/api-handlers";

export default function ProfilePage() {
  const { user, setUser, refreshUserData } = useAuth();

  // Account type
  const savedAccountType = user?.userdata?.AccountType || null;
  const [lockedAccountType, setLockedAccountType] = useState(savedAccountType);
  const [accountType, setAccountType] = useState(
    savedAccountType || "Individual"
  );

  // Error state
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);

  // Security form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState(false); // For displaying password requirements message

  // For Individual
  const [firstName, setFirstName] = useState(user?.userdata?.FirstName || "");
  const [lastName, setLastName] = useState(user?.userdata?.LastName || "");
  const [country, setCountry] = useState(user?.userdata?.Country || "India");
  const [city, setCity] = useState(user?.userdata?.City || "");
  const [address, setAddress] = useState(user?.userdata?.Address || "");

  // For Company
  const [companyName, setCompanyName] = useState(
    user?.userdata?.CompanyName || ""
  );

  // Check if form values changed compared to saved user data
  const hasChanges = () => {
    if (lockedAccountType === "Individual") {
      return (
        firstName !== (user?.userdata?.FirstName || "") ||
        lastName !== (user?.userdata?.LastName || "") ||
        country !== (user?.userdata?.Country || "India") ||
        city !== (user?.userdata?.City || "") ||
        address !== (user?.userdata?.Address || "")
      );
    } else if (lockedAccountType === "Company") {
      return (
        companyName !== (user?.userdata?.CompanyName || "") ||
        country !== (user?.userdata?.Country || "India") ||
        city !== (user?.userdata?.City || "") ||
        address !== (user?.userdata?.Address || "")
      );
    } else {
      return true;
    }
  };

  // Prevent AccountType change if locked to opposite type
  const handleAccountTypeChange = (value) => {
    if (lockedAccountType && value !== lockedAccountType) {
      toast.error(
        `Account Type is locked to ${lockedAccountType}. You can't switch to ${value}.`
      );
      return;
    }
    setAccountType(value);
  };

  // Disable inputs if locked to opposite AccountType
  const isIndividualLocked =
    lockedAccountType && lockedAccountType !== "Individual";
  const isCompanyLocked = lockedAccountType && lockedAccountType !== "Company";

  // Validate the form inputs
  const validateForm = () => {
    const newErrors = {};
    if (accountType === "Individual") {
      if (!firstName.trim()) newErrors.firstName = "First Name is required";
      if (!lastName.trim()) newErrors.lastName = "Last Name is required";
      if (!city.trim()) newErrors.city = "City is required";
      if (!address.trim()) newErrors.address = "Address is required";
    } else if (accountType === "Company") {
      if (!companyName.trim())
        newErrors.companyName = "Company Name is required";
      if (!city.trim()) newErrors.city = "City is required";
      if (!address.trim()) newErrors.address = "Address is required";
    }
    if (!country.trim()) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile details handler
  const handleSaveDetails = async (e) => {
    e.preventDefault(); // Prevent form refresh

    if (!validateForm()) return;

    setSaving(true);
    try {
      let profileData = {};

      if (accountType === "Individual") {
        profileData = {
          AccountType: "Individual",
          FirstName: firstName,
          LastName: lastName,
          Address: address,
          City: city,
          Country: country,
        };
      } else {
        profileData = {
          AccountType: "Company",
          CompanyName: companyName,
          Address: address,
          City: city,
          Country: country,
        };
      }

      const result = await authHandlers.updateProfile(profileData);

      if (result && result.status === 200) {
        setUser((prevUser) => ({
          ...prevUser,
          userdata: {
            ...prevUser.userdata,
            ...profileData,
          },
        }));

        await refreshUserData();
        toast.success(result.data.message);

        setLockedAccountType(accountType);
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault(); // Prevent full page reload

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const passwordData = {
        OldPassword: currentPassword,
        NewPassword: newPassword,
      };

      const response = await authHandlers.changePassword(passwordData);
      console.log("Password change API response:", response);

      if (response && response.status === 200) {
        await refreshUserData();
        toast.success(response.data.message);
        setErrorMessage("");
      }

      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);

      if (error.response) {
        if (error.response.status === 409) {
          setErrorMessage("Incorrect password. Please try again.");
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      } else {
        setErrorMessage("An unknown error occurred. Please try again later.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="text-white min-h-screen">
      <h1 className="text-3xl text-blue-100 font-bold mb-8">Profile</h1>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left: Profile Info (static) */}
        <div className="bg-blue-900 rounded-lg p-6 shadow-md flex-grow">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A9 9 0 1117.803 5.12M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Profile Information
          </h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm opacity-70 mb-1">Name</p>
              <p className="bg-blue-800 rounded-md p-3 select-text">
                {user?.userdata?.Username}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-70 mb-1">Email</p>
              <p className="bg-blue-800 rounded-md p-3 select-text">
                {user?.userdata?.Email || "email"}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-70 mb-1">TelegramUsername</p>
              <p className="bg-blue-800 rounded-md p-3 select-text">
                {user?.userdata?.TelegramUsername || "@telegram_username"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Security Settings */}
        <div className="bg-blue-900 rounded-lg p-6 shadow-md flex-grow">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Shield size={24} />
            Security Settings
          </h2>

          <form onSubmit={handleChangePassword}>
            <div className="space-y-6">
              {errorMessage && (
                <p className="text-red-500 mb-4 font-semibold">
                  {errorMessage}
                </p>
              )}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block mb-1 font-semibold"
                >
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block mb-1 font-semibold"
                >
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  htmlFor="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={
                    showPassword
                      ? ""
                      : "Password must be at least 8 characters and include a number and special character"
                  }
                  className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                {showPassword && passwordRequirements && (
                  <p className="text-xs text-blue-300 mt-2">
                    Password must be at least 8 characters and include a number
                    and special character.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block mb-1 font-semibold"
                >
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  style={{ cursor: "pointer" }}
                  onChange={() => {
                    setShowPassword(!showPassword);
                    setPasswordRequirements(true); // Show password requirements when checked
                  }}
                  className="accent-blue-600"
                />
                <label htmlFor="show-password" className="font-semibold">
                  Show Passwords
                </label>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg text-white font-semibold transition w-full"
              >
                {changingPassword ? (
                  <>
                    <span className="mr-2">⟳</span> Changing...
                  </>
                ) : (
                  <>Update Password</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Details Form Below */}
      <div className="bg-blue-900 rounded-lg p-6 shadow-md mt-10 w-full">
        <h2 className="text-xl font-semibold mb-6 border-b border-blue-700 pb-3">
          Account Details
        </h2>

        <form onSubmit={handleSaveDetails} className="space-y-6">
          {/* Account Type */}
          <div className="mb-6">
            <p className="font-semibold mb-2">Account Type</p>
            <div className="flex flex-col gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="Individual"
                  checked={accountType === "Individual"}
                  onChange={() => handleAccountTypeChange("Individual")}
                  className="accent-blue-600"
                  disabled={isCompanyLocked}
                />
                Individual
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="Company"
                  checked={accountType === "Company"}
                  onChange={() => handleAccountTypeChange("Company")}
                  className="accent-blue-600"
                  disabled={isIndividualLocked}
                />
                Company
              </label>
            </div>
          </div>

          {/* Form fields based on account type */}
          {accountType === "Individual" ? (
            <>
              {/* First and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block mb-1 font-semibold"
                    htmlFor="firstName"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block mb-1 font-semibold"
                    htmlFor="lastName"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Country and City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 font-semibold" htmlFor="country">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm">{errors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-semibold" htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm">{errors.city}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block mb-1 font-semibold" htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
                {errors.address && (
                  <p className="text-red-500 text-sm">{errors.address}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Company Name */}
              <div>
                <label
                  className="block mb-1 font-semibold"
                  htmlFor="companyName"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm">{errors.companyName}</p>
                )}
              </div>

              {/* City and Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                <div>
                  <label
                    className="block mb-1 font-semibold"
                    htmlFor="companyCity"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyCity"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block mb-1 font-semibold"
                    htmlFor="companyCountry"
                  >
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyCountry"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm">{errors.country}</p>
                  )}
                </div>
              </div>

              {/* Company Address */}
              <div className="mt-6">
                <label
                  className="block mb-1 font-semibold"
                  htmlFor="companyAddress"
                >
                  Company Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyAddress"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md bg-blue-800 border border-blue-700 px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
                {errors.address && (
                  <p className="text-red-500 text-sm">{errors.address}</p>
                )}
              </div>
            </>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving || !hasChanges()}
            className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg text-white font-semibold transition"
          >
            <span className="flex items-center">
              {saving ? (
                <>
                  <span className="mr-2">⟳</span> Saving...
                </>
              ) : (
                <>  
                  <Save className="mr-2 h-4 w-4" /> Save Details
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
