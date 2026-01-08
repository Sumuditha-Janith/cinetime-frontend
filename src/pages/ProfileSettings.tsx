import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { updateProfile, changePassword, deleteAccount, validatePassword } from "../services/auth.service";
import Navbar from "../components/Navbar";

export default function ProfileSettings() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState({
        profile: false,
        password: false,
        delete: false
    });
    const [activeTab, setActiveTab] = useState<"profile" | "password" | "delete">("profile");
    
    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstname: "",
        lastname: "",
        email: ""
    });
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Delete account state
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                firstname: user.firstname || "",
                lastname: user.lastname || "",
                email: user.email || ""
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setProfileMessage("");
        setProfileError("");

        if (!profileForm.firstname.trim() || !profileForm.lastname.trim()) {
            setProfileError("First name and last name are required");
            return;
        }

        setLoading(prev => ({ ...prev, profile: true }));
        try {
            const res = await updateProfile({
                firstname: profileForm.firstname.trim(),
                lastname: profileForm.lastname.trim()
            });
            setProfileMessage(res.message);
            // Update user context if needed
            if (user) {
                user.firstname = profileForm.firstname;
                user.lastname = profileForm.lastname;
            }
        } catch (err: any) {
            setProfileError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    };

    const validatePasswordForm = (): boolean => {
        const errors: string[] = [];

        if (!passwordForm.currentPassword) {
            errors.push("Current password is required");
        }

        if (!passwordForm.newPassword) {
            errors.push("New password is required");
        } else {
            const validation = validatePassword(passwordForm.newPassword);
            if (!validation.valid) {
                errors.push(validation.message);
            }
        }

        if (!passwordForm.confirmPassword) {
            errors.push("Please confirm your new password");
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.push("Passwords do not match");
        }

        setPasswordErrors(errors);
        return errors.length === 0;
    };

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordMessage("");
        setPasswordError("");
        setPasswordErrors([]);

        if (!validatePasswordForm()) {
            return;
        }

        setLoading(prev => ({ ...prev, password: true }));
        try {
            const res = await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordMessage(res.message);
            // Clear form
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(prev => ({ ...prev, password: false }));
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Please enter your password to confirm");
            return;
        }

        setLoading(prev => ({ ...prev, delete: true }));
        try {
            await deleteAccount(deletePassword);
            logout();
            navigate("/");
        } catch (err: any) {
            setDeleteError(err.response?.data?.message || "Failed to delete account");
        } finally {
            setLoading(prev => ({ ...prev, delete: false }));
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <Navbar />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
                    <p className="text-slate-400">Manage your account information and security</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex space-x-1 border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "profile"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            👤 Personal Info
                        </button>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "password"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            🔒 Change Password
                        </button>
                        <button
                            onClick={() => setActiveTab("delete")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "delete"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            ⚠️ Delete Account
                        </button>
                    </div>
                </div>

                {/* Profile Info Tab */}
                {activeTab === "profile" && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                        <h2 className="text-xl font-bold mb-6">Personal Information</h2>
                        
                        {/* Success Message */}
                        {profileMessage && (
                            <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-lg mb-6">
                                {profileMessage}
                            </div>
                        )}
                        
                        {/* Error Message */}
                        {profileError && (
                            <div className="bg-rose-900/30 border border-rose-500/30 text-rose-300 p-4 rounded-lg mb-6">
                                {profileError}
                            </div>
                        )}

                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.firstname}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, firstname: e.target.value }))}
                                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.lastname}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, lastname: e.target.value }))}
                                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                                    disabled
                                />
                                <p className="text-sm text-slate-500 mt-2">
                                    Email cannot be changed. Contact support if you need to update your email.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <button
                                    type="submit"
                                    disabled={loading.profile}
                                    className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading.profile ? (
                                        <span className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Saving...
                                        </span>
                                    ) : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Change Password Tab */}
                {activeTab === "password" && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                        <h2 className="text-xl font-bold mb-6">Change Password</h2>
                        
                        {/* Success Message */}
                        {passwordMessage && (
                            <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-lg mb-6">
                                {passwordMessage}
                            </div>
                        )}
                        
                        {/* Error Message */}
                        {passwordError && (
                            <div className="bg-rose-900/30 border border-rose-500/30 text-rose-300 p-4 rounded-lg mb-6">
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                                    placeholder="••••••••"
                                    required
                                />
                                <p className="text-sm text-slate-500 mt-2">
                                    Must be at least 6 characters with one uppercase letter and one number
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {/* Password Errors */}
                            {passwordErrors.length > 0 && (
                                <div className="bg-rose-900/20 border border-rose-500/20 rounded-lg p-4">
                                    <h4 className="font-medium text-rose-400 mb-2">Please fix the following:</h4>
                                    <ul className="space-y-1">
                                        {passwordErrors.map((error, index) => (
                                            <li key={index} className="text-sm text-rose-300 flex items-center">
                                                <span className="mr-2">•</span>
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                                <button
                                    type="submit"
                                    disabled={loading.password}
                                    className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading.password ? (
                                        <span className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Changing Password...
                                        </span>
                                    ) : "Change Password"}
                                </button>

                                <a
                                    href="/forgot-password"
                                    className="text-rose-400 hover:text-rose-300 hover:underline text-sm"
                                >
                                    Forgot your current password?
                                </a>
                            </div>
                        </form>
                    </div>
                )}

                {/* Delete Account Tab */}
                {activeTab === "delete" && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                        <h2 className="text-xl font-bold mb-6 text-rose-400">Delete Account</h2>
                        
                        <div className="bg-rose-900/20 border border-rose-500/20 rounded-lg p-6 mb-6">
                            <div className="flex items-start mb-4">
                                <span className="text-2xl mr-3">⚠️</span>
                                <div>
                                    <h3 className="font-bold text-rose-300 mb-2">Warning: This action cannot be undone</h3>
                                    <p className="text-slate-300">
                                        Deleting your account will permanently remove all your data, including:
                                    </p>
                                    <ul className="mt-2 space-y-1 text-slate-400">
                                        <li>• Your profile information</li>
                                        <li>• Watchlist and saved items</li>
                                        <li>• Movie ratings and reviews</li>
                                        <li>• Activity history</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {!showDeleteConfirm ? (
                            <div className="text-center py-8">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-rose-700 hover:bg-rose-800 text-slate-50 font-bold py-3 px-8 rounded-lg transition duration-200 border border-rose-600"
                                >
                                    I understand, delete my account
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Error Message */}
                                {deleteError && (
                                    <div className="bg-rose-900/30 border border-rose-500/30 text-rose-300 p-4 rounded-lg">
                                        {deleteError}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">
                                        Confirm Password
                                    </label>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Please enter your password to confirm account deletion
                                    </p>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="flex space-x-4 pt-4 border-t border-slate-700">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={loading.delete}
                                        className="flex-1 bg-rose-700 hover:bg-rose-800 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading.delete ? (
                                            <span className="flex items-center justify-center">
                                                <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Deleting...
                                            </span>
                                        ) : "Yes, Delete My Account"}
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeletePassword("");
                                            setDeleteError("");
                                        }}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium py-3 px-6 rounded-lg transition duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Account Status Info */}
                <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-bold mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-400">Account Status</p>
                            <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    user.approved === "APPROVED"
                                        ? "bg-green-900/30 text-green-300"
                                        : "bg-yellow-900/30 text-yellow-300"
                                }`}>
                                    {user.approved === "APPROVED" ? "✓ Verified" : "⏳ Pending"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Email Status</p>
                            <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    user.isEmailVerified
                                        ? "bg-green-900/30 text-green-300"
                                        : "bg-yellow-900/30 text-yellow-300"
                                }`}>
                                    {user.isEmailVerified ? "✓ Verified" : "⚠️ Not Verified"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Account Type</p>
                            <p className="text-slate-50 mt-1">{user.roles?.join(", ") || "User"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Member Since</p>
                            <p className="text-slate-50 mt-1">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}