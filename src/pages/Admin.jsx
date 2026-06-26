import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Settings,
  Plus,
  Trash2,
  Save,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Image,
  Database,
  Mail,
  Sliders,
  LogOut,
  Search,
  Filter,
  Check,
  X,
  Briefcase,
  Phone,
  Clock,
  User,
  PlusCircle,
  Edit,
  TrendingUp,
  Zap,
  ChevronDown,
  Globe,
  Menu,
  ChevronLeft,
  ChevronRight,
  Share2,
  Key,
  FileSpreadsheet,
  Copy,
  CheckSquare,
  Square
} from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Input, TextArea } from "../ui/Input.jsx";
import { Badge } from "../ui/Badge.jsx";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase.js";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  serverTimestamp, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";


// Helper to translate and format Firebase Auth errors into highly professional messages
const getFriendlyAuthError = (err) => {
  if (!err) return "An unexpected administrative portal error occurred. Please try again.";
  const msg = (err.message || String(err)).toLowerCase();
  
  if (msg.includes("operation-not-allowed") || msg.includes("auth/operation-not-allowed")) {
    return "Administrative Sign-In Service Inactive: The requested secure login method is currently disabled. Please ensure the Email/Password provider is enabled in your system's authentication settings.";
  }
  if (msg.includes("invalid-credential") || msg.includes("auth/invalid-credential") || msg.includes("invalid-email") || msg.includes("wrong-password")) {
    return "Access Denied: The email or password credentials provided do not match our administrative records.";
  }
  if (msg.includes("user-not-found") || msg.includes("auth/user-not-found")) {
    return "Account Not Found: No registered administrative account corresponds to this email address.";
  }
  if (msg.includes("too-many-requests") || msg.includes("auth/too-many-requests")) {
    return "Access Suspended: Too many login attempts detected. Please wait a few moments before trying again to secure your account.";
  }
  if (msg.includes("network-request-failed") || msg.includes("network")) {
    return "Network Offline: Secure connection to the authentication servers could not be established. Please check your internet connection.";
  }
  
  // Format generic or raw errors cleanly
  let cleanMsg = err.message || String(err);
  if (cleanMsg.startsWith("Firebase: ")) {
    cleanMsg = cleanMsg.replace("Firebase: ", "");
  }
  if (cleanMsg.includes("Error (auth/")) {
    const match = cleanMsg.match(/\((auth\/[^)]+)\)/);
    if (match) {
      const code = match[1].replace("auth/", "").replace(/-/g, " ");
      cleanMsg = code.charAt(0).toUpperCase() + code.slice(1) + ".";
    }
  }
  return `Administrative Error: ${cleanMsg}`;
};

export function Admin({ content, onRefresh, onViewChange }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);
  const [showEnableAuthGuide, setShowEnableAuthGuide] = useState(false);

  // Admin Profile & Security states
  const [changeEmailValue, setChangeEmailValue] = useState("");
  const [changePasswordValue, setChangePasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [currentPasswordValue, setCurrentPasswordValue] = useState("");
  const [reauthType, setReauthType] = useState(""); // "email" or "password"
  const [securityMessage, setSecurityMessage] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [isAdminDocReady, setIsAdminDocReady] = useState(false);

  // OTP-based password reset states
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1 = request, 2 = verify & reset
  const [otpValue, setOtpValue] = useState("");
  const [otpSandboxCode, setOtpSandboxCode] = useState("");

  // Form states (cloned from content prop once authenticated)
  const [editContent, setEditContent] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");

  // Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Status banners
  const [saveStatus, setSaveStatus] = useState(null);

  // Active tab inside Admin Dashboard
  const [activeTab, setActiveTab] = useState("global");

  // Sidebar toggle state (for desktop and mobile)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Product Inventory Search/Filter/Add States
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSortOrder, setProductSortOrder] = useState("default");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    capacity: "250 KVA",
    losses: "520W (No-Load) / 3250W (Load)",
    regulation: "2.6%",
    efficiency: "98.5%",
    oil: "260 L",
    weight: "1250 kg",
    status: "In Stock",
    category: "Distribution Transformer"
  });
  const [editingProductIdx, setEditingProductIdx] = useState(null);

  // Recent Projects States
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    titleBn: "",
    client: "",
    clientBn: "",
    location: "",
    locationBn: "",
    capacity: "",
    capacityBn: "",
    commissionedDate: "",
    description: "",
    descriptionBn: "",
    image: ""
  });
  const [editingProjectIdx, setEditingProjectIdx] = useState(null);

  // Inquiry Search/Filter/Add States
  const [inquirySearchQuery, setInquirySearchQuery] = useState("");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
  const [isAddingInquiry, setIsAddingInquiry] = useState(false);
  const [newInquiryForm, setNewInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    requirements: "",
    status: "New",
    adminNotes: ""
  });
  const [editingInquiryId, setEditingInquiryId] = useState(null);
  const [editingInquiryForm, setEditingInquiryForm] = useState(null);

  const ensureAdminDocument = async (currentUser) => {
    if (!currentUser || !currentUser.uid) return;
    try {
      const adminDocRef = doc(db, "admins", currentUser.uid);
      await setDoc(adminDocRef, {
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log("Admin security credential mapped in Firestore successfully.");
    } catch (err) {
      console.warn("Bootstrap admin doc skipped/failed:", err);
    }
  };

  // Sync state with Firebase auth status on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAuthenticated(true);
        await ensureAdminDocument(currentUser);
        setIsAdminDocReady(true);
        const cloned = JSON.parse(JSON.stringify(content));
        if (cloned && !cloned.recentProjects) {
          cloned.recentProjects = [];
        }
        setEditContent(cloned);
      } else {
        setIsAuthenticated(false);
        setIsAdminDocReady(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [content]);

  // Load inquiries when authenticated
  useEffect(() => {
    if (isAuthenticated && isAdminDocReady) {
      fetchInquiries();
    }
  }, [isAuthenticated, isAdminDocReady]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setShowEnableAuthGuide(false);

    try {
      // Use Firebase Client SDK login as documented in database.md
      await signInWithEmailAndPassword(auth, username, password);
      // Success will trigger the onAuthStateChanged listener
    } catch (err) {
      const friendlyError = getFriendlyAuthError(err);
      console.error("Firebase Login Verification Failure:", friendlyError);
      if (err instanceof Error && (err.message.includes("operation-not-allowed") || err.message.includes("auth/operation-not-allowed"))) {
        setShowEnableAuthGuide(true);
      }
      setLoginError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
      setSessionToken("");
      setUsername("");
      setPassword("");
      setPassphrase("");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      // Fetch directly from Firestore "inquiries" collection as documented in database.md
      const q = query(collection(db, "inquiries"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnapshot) => {
        list.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });
      setInquiries(list);
    } catch (e) {
      try {
        handleFirestoreError(e, OperationType.LIST, "inquiries");
      } catch (errInfo) {
        console.warn("Firestore read failed, utilizing local ledger fallback.");
      }
      try {
        const response = await fetch("/api/admin/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "authorized_session_token_eplt" })
        });
        if (response.ok) {
          const data = await response.json();
          setInquiries(data);
        }
      } catch (err) {
        console.error("All fallback layers exhausted.", err);
      }
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleClearInquiries = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all inquiry logs? This cannot be undone.")) return;
    setLoadingInquiries(true);
    try {
      // 1. Clear Firestore
      try {
        const batch = writeBatch(db);
        inquiries.forEach((item) => {
          batch.delete(doc(db, "inquiries", item.id));
        });
        await batch.commit();
        setInquiries([]);
        setSaveStatus({ success: true, message: "Inquiry log cleared from Firestore." });
        setLoadingInquiries(false);
        return;
      } catch (firestoreErr) {
        try {
          handleFirestoreError(firestoreErr, OperationType.DELETE, "inquiries");
        } catch (diagErr) {
          console.warn("Firestore batch delete failed; utilizing local fallback.");
        }
      }

      // 2. Server local file fallback
      const response = await fetch("/api/admin/inquiries/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "authorized_session_token_eplt" })
      });
      if (response.ok) {
        setInquiries([]);
        setSaveStatus({ success: true, message: "Inquiry log cleared from local ledger successfully." });
      }
    } catch (e) {
      console.error("Failed to clear inquiries", e);
      alert("Failed to clear inquiry log.");
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Synchronized Inquiries CRUD Handlers
  const handleCreateInquiryOnServer = async (e) => {
    e.preventDefault();
    if (!newInquiryForm.name || !newInquiryForm.email || !newInquiryForm.phone) {
      alert("Name, email, and phone are required to record an inquiry.");
      return;
    }
    setLoadingInquiries(true);
    try {
      // Try Firestore write first as documented in database.md
      try {
        const payload = {
          ...newInquiryForm,
          timestamp: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "inquiries"), payload);
        setInquiries(prev => [{ id: docRef.id, ...payload }, ...prev]);
        setNewInquiryForm({
          name: "",
          email: "",
          phone: "",
          requirements: "",
          status: "New",
          adminNotes: ""
        });
        setIsAddingInquiry(false);
        setSaveStatus({ success: true, message: "Manual client inquiry logged persistently in Firestore." });
        return;
      } catch (firestoreErr) {
        try {
          handleFirestoreError(firestoreErr, OperationType.CREATE, "inquiries");
        } catch (diagErr) {
          console.warn("Firestore direct insert failed; utilizing local fallback.");
        }
      }

      // Fallback
      const response = await fetch("/api/admin/inquiries/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "authorized_session_token_eplt",
          inquiry: newInquiryForm
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setNewInquiryForm({
          name: "",
          email: "",
          phone: "",
          requirements: "",
          status: "New",
          adminNotes: ""
        });
        setIsAddingInquiry(false);
        await fetchInquiries(); // Refresh list
        setSaveStatus({ success: true, message: "Manual client inquiry logged persistently." });
      } else {
        alert(data.error || "Failed to log inquiry on the server.");
      }
    } catch (err) {
      console.error("Error creating inquiry", err);
      alert("Network failure logging manual inquiry.");
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleUpdateInquiryOnServer = async (id, updatedFields) => {
    try {
      // Try Firestore update first as documented
      try {
        const docRef = doc(db, "inquiries", id);
        await updateDoc(docRef, updatedFields);
        setInquiries(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
        setSaveStatus({ success: true, message: "Inquiry entry updated successfully in Firestore." });
        return;
      } catch (firestoreErr) {
        try {
          handleFirestoreError(firestoreErr, OperationType.UPDATE, "inquiries");
        } catch (diagErr) {
          console.warn("Firestore update failed; utilizing local fallback.");
        }
      }

      // Fallback
      const response = await fetch("/api/admin/inquiries/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "authorized_session_token_eplt",
          id,
          updatedInquiry: updatedFields
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInquiries(prev => prev.map(item => item.id === id ? { ...item, ...data.inquiry } : item));
        setSaveStatus({ success: true, message: "Inquiry entry updated successfully in the ledger." });
      } else {
        alert(data.error || "Failed to update inquiry.");
      }
    } catch (err) {
      console.error("Error updating inquiry", err);
      alert("Network transmission failure saving inquiry updates.");
    }
  };

  const handleDeleteInquiryOnServer = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this client inquiry? This action cannot be undone.")) return;
    try {
      // Try Firestore delete first as documented
      try {
        const docRef = doc(db, "inquiries", id);
        await deleteDoc(docRef);
        setInquiries(prev => prev.filter(item => item.id !== id));
        setSaveStatus({ success: true, message: "Client inquiry removed from Firestore." });
        return;
      } catch (firestoreErr) {
        try {
          handleFirestoreError(firestoreErr, OperationType.DELETE, "inquiries");
        } catch (diagErr) {
          console.warn("Firestore delete failed; utilizing local fallback.");
        }
      }

      // Fallback
      const response = await fetch("/api/admin/inquiries/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "authorized_session_token_eplt",
          id
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInquiries(prev => prev.filter(item => item.id !== id));
        setSaveStatus({ success: true, message: "Client inquiry removed from database." });
      } else {
        alert(data.error || "Failed to delete inquiry.");
      }
    } catch (err) {
      console.error("Error deleting inquiry", err);
      alert("Network transmission failure deleting inquiry.");
    }
  };

  // Helper to sync duplicate values automatically
  const updateAllOccurrences = (obj, oldVal, newVal) => {
    if (!oldVal || typeof oldVal !== 'string' || oldVal.trim().length < 3) return obj;
    if (oldVal === newVal) return obj;

    const isPhoneMatch = (a, b) => {
      if (typeof a !== 'string' || typeof b !== 'string') return false;
      const digitsA = a.replace(/\D/g, '');
      const digitsB = b.replace(/\D/g, '');
      if (digitsA.length < 7 || digitsB.length < 7) return false;
      return digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA);
    };

    const walk = (item) => {
      if (typeof item === 'string') {
        if (item === oldVal) {
          return newVal;
        }
        if (isPhoneMatch(item, oldVal)) {
          return newVal;
        }
        return item;
      }
      if (Array.isArray(item)) {
        return item.map(walk);
      }
      if (item && typeof item === 'object') {
        const updated = {};
        for (const key in item) {
          updated[key] = walk(item[key]);
        }
        return updated;
      }
      return item;
    };

    return walk(obj);
  };

  // Content Modification Handlers
  const handleGlobalChange = (e) => {
    if (!editContent) return;
    const { name, value } = e.target;
    const oldVal = editContent[name];
    let updated = { ...editContent, [name]: value };
    if (oldVal) {
      updated = updateAllOccurrences(updated, oldVal, value);
    }
    setEditContent(updated);
  };

  const handleContactChange = (e) => {
    if (!editContent) return;
    const { name, value } = e.target;
    const oldVal = editContent.contact[name];
    let updated = {
      ...editContent,
      contact: { ...editContent.contact, [name]: value }
    };
    if (oldVal) {
      updated = updateAllOccurrences(updated, oldVal, value);
    }
    setEditContent(updated);
  };

  const handleAboutChange = (e) => {
    if (!editContent) return;
    const { name, value } = e.target;
    const oldVal = editContent.about[name];
    let updated = {
      ...editContent,
      about: { ...editContent.about, [name]: value }
    };
    if (oldVal) {
      updated = updateAllOccurrences(updated, oldVal, value);
    }
    setEditContent(updated);
  };

  const handleMaterialChange = (e) => {
    if (!editContent) return;
    const { name, value } = e.target;
    const oldVal = editContent.materials[name];
    let updated = {
      ...editContent,
      materials: { ...editContent.materials, [name]: value }
    };
    if (oldVal) {
      updated = updateAllOccurrences(updated, oldVal, value);
    }
    setEditContent(updated);
  };

  const handleHeroSlideChange = (idx, field, value) => {
    if (!editContent) return;
    const oldVal = editContent.heroSlides[idx][field];
    const updatedSlides = [...editContent.heroSlides];
    updatedSlides[idx] = { ...updatedSlides[idx], [field]: value };
    let updated = { ...editContent, heroSlides: updatedSlides };
    if (oldVal) {
      updated = updateAllOccurrences(updated, oldVal, value);
    }
    setEditContent(updated);
  };

  // Transformer Specifications Handlers
  const handleTransformerChange = (idx, field, value) => {
    if (!editContent) return;
    const oldVal = editContent.transformers[idx][field];
    const updatedTransformers = [...editContent.transformers];
    updatedTransformers[idx] = { ...updatedTransformers[idx], [field]: value };
    let updated = { ...editContent, transformers: updatedTransformers };
    if (oldVal) {
      updated = updateAllOccurrences(updated, oldVal, value);
    }
    setEditContent(updated);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const compressAndLoadImage = (file, callback) => {
    if (file.size > 1.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          callback(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        compressAndLoadImage(file, (dataUrl) => {
          if (index === null) {
            setNewProductForm(prev => ({ ...prev, image: dataUrl }));
          } else {
            handleTransformerChange(index, "image", dataUrl);
          }
        });
      }
    }
  };

  const handleFileChange = (e, index) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        compressAndLoadImage(file, (dataUrl) => {
          if (index === null) {
            setNewProductForm(prev => ({ ...prev, image: dataUrl }));
          } else {
            handleTransformerChange(index, "image", dataUrl);
          }
        });
      }
    }
  };

  const handleProjectChange = (idx, field, value) => {
    if (!editContent) return;
    const updatedProjects = [...editContent.recentProjects];
    updatedProjects[idx] = { ...updatedProjects[idx], [field]: value };
    setEditContent({ ...editContent, recentProjects: updatedProjects });
  };

  const handleProjectDrop = (e, index) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        compressAndLoadImage(file, (dataUrl) => {
          if (index === null) {
            setNewProjectForm(prev => ({ ...prev, image: dataUrl }));
          } else {
            handleProjectChange(index, "image", dataUrl);
          }
        });
      }
    }
  };

  const handleProjectFileChange = (e, index) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        compressAndLoadImage(file, (dataUrl) => {
          if (index === null) {
            setNewProjectForm(prev => ({ ...prev, image: dataUrl }));
          } else {
            handleProjectChange(index, "image", dataUrl);
          }
        });
      }
    }
  };

  const addTransformerRow = () => {
    if (!editContent) return;
    const newRow = {
      capacity: "500 KVA",
      losses: "950W (No-Load) / 5500W (Load)",
      regulation: "2.8%",
      efficiency: "98.7%",
      oil: "410 L",
      weight: "2100 kg"
    };
    setEditContent({
      ...editContent,
      transformers: [...editContent.transformers, newRow]
    });
  };

  const removeTransformerRow = (idx) => {
    if (!editContent) return;
    const updatedTransformers = editContent.transformers.filter((_, i) => i !== idx);
    setEditContent({ ...editContent, transformers: updatedTransformers });
  };

  const removeProjectRow = (idx) => {
    if (!editContent) return;
    const updatedProjects = editContent.recentProjects.filter((_, i) => i !== idx);
    setEditContent({ ...editContent, recentProjects: updatedProjects });
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!changeEmailValue) return;
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      await updateEmail(auth.currentUser, changeEmailValue);
      await ensureAdminDocument(auth.currentUser);
      setSecurityMessage({ success: true, text: `Successfully updated administrative email to ${changeEmailValue}.` });
      setChangeEmailValue("");
      setReauthType("");
      setCurrentPasswordValue("");
    } catch (err) {
      console.error("Email update failure", err);
      if (err && (err.code === "auth/requires-recent-login" || String(err).includes("requires-recent-login"))) {
        setReauthType("email");
        setSecurityMessage({ success: false, text: "Security Verification Required: Changing administrative email requires recent authentication. Please enter your current administrative password below to verify your identity." });
      } else {
        setSecurityMessage({ success: false, text: getFriendlyAuthError(err) });
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!changePasswordValue) return;
    if (changePasswordValue !== confirmPasswordValue) {
      setSecurityMessage({ success: false, text: "Password mismatch: The new password and password confirmation fields do not match." });
      return;
    }
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      await updatePassword(auth.currentUser, changePasswordValue);
      setSecurityMessage({ success: true, text: "Successfully updated administrative credentials password." });
      setChangePasswordValue("");
      setConfirmPasswordValue("");
      setReauthType("");
      setCurrentPasswordValue("");
    } catch (err) {
      console.error("Password update failure", err);
      if (err && (err.code === "auth/requires-recent-login" || String(err).includes("requires-recent-login"))) {
        setReauthType("password");
        setSecurityMessage({ success: false, text: "Security Verification Required: Changing your password requires recent authentication. Please enter your current administrative password below to verify your identity." });
      } else {
        setSecurityMessage({ success: false, text: getFriendlyAuthError(err) });
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleReauthenticate = async (e) => {
    e.preventDefault();
    if (!currentPasswordValue) return;
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPasswordValue);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      if (reauthType === "email") {
        await updateEmail(auth.currentUser, changeEmailValue);
        await ensureAdminDocument(auth.currentUser);
        setSecurityMessage({ success: true, text: `Identity verified. Successfully updated administrative email to ${changeEmailValue}.` });
        setChangeEmailValue("");
      } else if (reauthType === "password") {
        await updatePassword(auth.currentUser, changePasswordValue);
        setSecurityMessage({ success: true, text: "Identity verified. Successfully updated administrative credentials password." });
        setChangePasswordValue("");
        setConfirmPasswordValue("");
      }
      setReauthType("");
      setCurrentPasswordValue("");
    } catch (err) {
      console.error("Reauthentication failure", err);
      setSecurityMessage({ success: false, text: `Authentication Failed: ${getFriendlyAuthError(err)}` });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleTriggerResetEmailInDashboard = async () => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setSecurityMessage({ success: true, text: `Successfully dispatched an official Firebase password reset recovery link to ${auth.currentUser.email}. Check your inbox or spam folder.` });
    } catch (err) {
      console.error("Failed to send reset link from dashboard", err);
      setSecurityMessage({ success: false, text: getFriendlyAuthError(err) });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!auth.currentUser || !auth.currentUser.email) {
      setSecurityMessage({ success: false, text: "No active user session detected to request verification." });
      return;
    }
    setSecurityLoading(true);
    setSecurityMessage(null);
    setOtpSandboxCode("");
    try {
      const response = await fetch("/api/admin/forgot-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.currentUser.email })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpStep(2);
        let msg = data.message;
        if (data.smtpNotConfigured) {
          setOtpSandboxCode(data.otp);
          msg = `Sandbox Preview Mode: Verification OTP code has been generated. Since SMTP is not configured in Settings, your verification OTP code is: ${data.otp}. Enter this code below to proceed.`;
        }
        setSecurityMessage({ success: true, text: msg });
      } else {
        setSecurityMessage({ success: false, text: data.error || "Failed to generate security verification code." });
      }
    } catch (err) {
      console.error("OTP request failure", err);
      setSecurityMessage({ success: false, text: "Network failure requesting administrative OTP verification." });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    if (!otpValue) {
      setSecurityMessage({ success: false, text: "Please enter the 6-digit OTP code sent to your email." });
      return;
    }
    if (!changePasswordValue) {
      setSecurityMessage({ success: false, text: "Please provide a new password." });
      return;
    }
    if (changePasswordValue !== confirmPasswordValue) {
      setSecurityMessage({ success: false, text: "Password confirmation mismatch. Please verify passwords match." });
      return;
    }
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      const response = await fetch("/api/admin/verify-otp-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.currentUser.email,
          otp: otpValue,
          newPassword: changePasswordValue
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSecurityMessage({ success: true, text: "Security credentials password successfully updated via OTP authorization!" });
        setChangePasswordValue("");
        setConfirmPasswordValue("");
        setOtpValue("");
        setOtpSandboxCode("");
        setIsOtpMode(false);
        setOtpStep(1);
      } else {
        setSecurityMessage({ success: false, text: data.error || "Verification failed." });
      }
    } catch (err) {
      console.error("OTP verification failure", err);
      setSecurityMessage({ success: false, text: "Network failure authorizing OTP code." });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!editContent) return;
    setLoading(true);
    setSaveStatus(null);

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: sessionToken,
          content: editContent,
          newUsername: newUsername || undefined,
          newPassphrase: newPassphrase || undefined
        })
      });

      const res = await response.json();
      if (response.ok && res.success) {
        setSaveStatus({ success: true, message: "System configurations updated successfully on the server." });
        setNewUsername("");
        setNewPassphrase("");
        onRefresh(); // trigger parent update to fetch new content
      } else {
        setSaveStatus({ success: false, message: res.error || "Save operation failed." });
      }
    } catch (err) {
      setSaveStatus({ success: false, message: "Network transmission failure saving changes." });
    } finally {
      setLoading(false);
    }
  };

  // If unauthorized, render simple gatekeep shield
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-24 bg-white text-slate-800">
        <div className="max-w-md w-full bg-slate-50 border border-slate-200 p-8 rounded-2xl relative shadow-md space-y-6 text-center">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gold"></div>
          
          <div className="inline-flex p-4 bg-brand-gold/10 rounded-full text-brand-gold">
            <Lock className="w-8 h-8" />
          </div>

          {!isResetMode ? (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-display font-bold text-slate-900">EPLT Administration Portal</h2>
                <p className="text-xs text-slate-600">
                  Enter your administrative email and password to securely manage the catalog and client inquiries.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <Input
                    label="ADMIN EMAIL"
                    type="email"
                    placeholder="e.g., admin@eplt.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-white border-slate-300 text-slate-950 font-sans"
                  />
                </div>

                <div>
                  <Input
                    label="ADMIN PASSWORD"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-slate-300 text-slate-950 font-sans"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStatus(null);
                      setIsResetMode(true);
                    }}
                    className="text-xs text-brand-gold hover:underline cursor-pointer font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                {loginError && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-xs leading-relaxed font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full flex items-center justify-center space-x-2 text-white font-semibold cursor-pointer py-2.5"
                >
                  <span>Verify Credentials</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-display font-bold text-slate-900">Password Recovery</h2>
                <p className="text-xs text-slate-600">
                  Enter your registered admin email address. We will transmit an official Firebase recovery reset link.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!resetEmail) return;
                  setLoading(true);
                  setResetStatus(null);
                  setShowEnableAuthGuide(false);
                  try {
                    await sendPasswordResetEmail(auth, resetEmail);
                    setResetStatus({
                      success: true,
                      message: "Success! Reset link dispatched. Check your inbox and spam folder."
                    });
                  } catch (err) {
                    console.error("Firebase reset link failure", err);
                    const friendlyError = getFriendlyAuthError(err);
                    if (err instanceof Error && (err.message.includes("operation-not-allowed") || err.message.includes("auth/operation-not-allowed"))) {
                      setShowEnableAuthGuide(true);
                    }
                    setResetStatus({
                      success: false,
                      message: friendlyError
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4 text-left"
              >
                <div>
                  <Input
                    label="ADMIN EMAIL"
                    type="email"
                    placeholder="e.g., admin@eplt.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="bg-white border-slate-300 text-slate-950 font-sans"
                  />
                </div>

                {resetStatus && (
                  <div className={`flex items-start space-x-2 p-3 border rounded text-xs leading-relaxed ${
                    resetStatus.success 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}>
                    {resetStatus.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{resetStatus.message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full flex items-center justify-center space-x-2 text-white font-semibold cursor-pointer py-2.5"
                >
                  <span>Request Reset Link</span>
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Return to Login
                  </button>
                </div>
              </form>
            </>
          )}

          {showEnableAuthGuide && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-left text-xs space-y-3 shadow-sm mt-4">
              <div className="flex items-center space-x-2 font-semibold text-amber-800">
                <Settings className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                <span>Firebase Auth Setup Required</span>
              </div>
              <p className="leading-relaxed">
                To enable authentication, please perform these quick steps in your Firebase console:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 leading-normal text-amber-800">
                <li>
                  Open your project's{" "}
                  <a
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline text-amber-700 hover:text-amber-950 inline-flex items-center"
                  >
                    Sign-in Methods page <Globe className="w-3 h-3 ml-0.5 inline shrink-0" />
                  </a>
                </li>
                <li>Click <strong>Add new provider</strong> or <strong>Get Started</strong>.</li>
                <li>Select <strong>Email/Password</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong>.</li>
                <li>
                  Go to the <strong>Users</strong> tab and click <strong>Add User</strong>.
                </li>
                <li>
                  Register your administrative email (e.g., <strong>admin@eplt.com</strong>) with a secure password.
                </li>
              </ol>
              <p className="text-[10px] text-amber-600 leading-normal font-mono pt-1">
                Once enabled, you will be able to log in immediately with the registered credentials.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col items-center space-y-2 border-t border-slate-200/60 mt-4">
            {onViewChange && (
              <button
                type="button"
                onClick={() => onViewChange("home")}
                className="text-xs text-brand-gold hover:underline flex items-center space-x-1 cursor-pointer font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Return to Live Website</span>
              </button>
            )}
            <div className="text-[10px] font-mono text-slate-400 leading-normal">
              Power Line Tech • Multi-Tenant Enterprise Administration
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Authorized Panel
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8 bg-white text-slate-800">
      
      {/* Top Welcome Control Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Unlock className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-600 font-mono text-xs font-semibold uppercase tracking-wider">
              Authorized Portal Access
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight mt-1">
            Content Administration Dashboard
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Configure website copy, homepage slideshow, product specifications, and review inbound client inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onViewChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewChange("home")}
              className="flex items-center space-x-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-brand-gold" />
              <span>Return to Website</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>

          <Button
            variant="gold"
            size="md"
            onClick={handleSaveAllChanges}
            disabled={loading}
            className="flex items-center space-x-1.5 text-white font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{loading ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Save Status Toast */}
      {saveStatus && (
        <div className={`p-4 rounded-lg flex items-start space-x-3 text-sm ${
          saveStatus.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {saveStatus.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Dashboard Layout Container (Sidebar + Content Panel) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        
        {/* MOBILE SIDEBAR TRIGGER BAR */}
        <div className="w-full lg:hidden flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-brand-gold animate-spin" style={{ animationDuration: "12s" }} />
            <span className="font-semibold text-xs sm:text-sm text-slate-800">
              {activeTab === "global" && "General Copy & Contact"}
              {activeTab === "hero" && "Slideshow Slides"}
              {activeTab === "transformers" && "Product Inventory"}
              {activeTab === "recentProjects" && "Recent Projects"}
              {activeTab === "leads" && `Client CRM Leads (${inquiries.length})`}
              {activeTab === "integrations" && "External CRM Integrations"}
              {activeTab === "profile" && "Admin Security & Credentials"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center space-x-1.5 border-slate-300 text-slate-700"
          >
            <Menu className="w-4 h-4" />
            <span>Navigation Menu</span>
          </Button>
        </div>

        {/* MOBILE SIDEBAR DRAWER OVERLAY */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsMobileSidebarOpen(false)}
            ></div>
            
            {/* Drawer Content */}
            <div className="relative flex flex-col max-w-xs w-full bg-white border-r border-slate-200 p-6 space-y-6 shadow-xl transition-transform duration-300 h-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Unlock className="w-5 h-5 text-emerald-600" />
                  <span className="font-display font-bold text-slate-900">Admin Panels</span>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto">
                <button
                  onClick={() => { setActiveTab("global"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "global"
                      ? "bg-brand-gold/10 text-brand-gold font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span>General Copy & Contact</span>
                </button>

                <button
                  onClick={() => { setActiveTab("hero"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "hero"
                      ? "bg-brand-gold/10 text-brand-gold font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                  <span>Slideshow Slides</span>
                </button>

                <button
                  onClick={() => { setActiveTab("transformers"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "transformers"
                      ? "bg-plt-purple/10 text-plt-purple font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Database className="w-5 h-5" />
                  <span>Product Inventory</span>
                </button>

                <button
                  onClick={() => { setActiveTab("recentProjects"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "recentProjects"
                      ? "bg-brand-gold/10 text-brand-gold font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span>Recent Projects</span>
                </button>

                <button
                  onClick={() => { setActiveTab("leads"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "leads"
                      ? "bg-plt-purple/10 text-plt-purple font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5" />
                    <span>Client CRM Leads</span>
                  </div>
                  <span className="bg-plt-purple/10 text-plt-purple text-[11px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {inquiries.length}
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab("integrations"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "integrations"
                      ? "bg-plt-purple/10 text-plt-purple font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Share2 className="w-5 h-5" />
                  <span>CRM Integrations</span>
                </button>

                <button
                  onClick={() => { setActiveTab("profile"); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-amber-500/10 text-amber-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Admin Security & Email</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">Power Line Tech v1.2</span>
                <Button variant="outline" size="xs" onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP SIDEBAR PANEL (Collapsible) */}
        <aside 
          className={`hidden lg:flex flex-col shrink-0 border border-slate-200 bg-slate-50/50 rounded-2xl p-4 transition-all duration-300 relative self-stretch ${
            isSidebarExpanded ? "w-64" : "w-20"
          }`}
        >
          {/* Collapse Toggle Button floating on side edge */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="absolute -right-3 top-6 bg-white border border-slate-200 shadow-md p-1 rounded-full text-slate-600 hover:text-slate-900 hover:scale-110 transition-all cursor-pointer z-20"
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Sidebar Top Heading */}
          <div className="mb-6 px-2 flex items-center space-x-3 overflow-hidden h-9">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg text-brand-gold shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            {isSidebarExpanded && (
              <span className="font-display font-bold text-slate-800 text-sm tracking-wide uppercase transition-opacity duration-300 whitespace-nowrap">
                Navigation
              </span>
            )}
          </div>

          {/* Sidebar Menu Items */}
          <div className="space-y-1.5 flex-1">
            <button
              onClick={() => setActiveTab("global")}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3 space-x-3" : "p-3 justify-center"
              } ${
                activeTab === "global"
                  ? "bg-brand-gold text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? "General Copy & Contact" : undefined}
            >
              <Globe className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">General Copy</span>}
            </button>

            <button
              onClick={() => setActiveTab("hero")}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3 space-x-3" : "p-3 justify-center"
              } ${
                activeTab === "hero"
                  ? "bg-brand-gold text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? "Slideshow Slides" : undefined}
            >
              <Sliders className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">Slideshow Slides</span>}
            </button>

            <button
              onClick={() => setActiveTab("transformers")}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3 space-x-3" : "p-3 justify-center"
              } ${
                activeTab === "transformers"
                  ? "bg-plt-purple text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? "Product Inventory" : undefined}
            >
              <Database className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">Product Inventory</span>}
            </button>

            <button
              onClick={() => setActiveTab("recentProjects")}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3 space-x-3" : "p-3 justify-center"
              } ${
                activeTab === "recentProjects"
                  ? "bg-brand-gold text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? "Recent Projects" : undefined}
            >
              <Briefcase className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">Recent Projects</span>}
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center justify-between rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3" : "p-3 justify-center"
              } ${
                activeTab === "leads"
                  ? "bg-plt-purple text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? `Client CRM Leads (${inquiries.length})` : undefined}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <Mail className="w-5 h-5 shrink-0" />
                {isSidebarExpanded && <span className="whitespace-nowrap">CRM Leads</span>}
              </div>
              {isSidebarExpanded && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                  activeTab === "leads" ? "bg-white/20 text-white" : "bg-plt-purple/10 text-plt-purple"
                }`}>
                  {inquiries.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3 space-x-3" : "p-3 justify-center"
              } ${
                activeTab === "integrations"
                  ? "bg-plt-purple text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? "CRM Integrations" : undefined}
            >
              <Share2 className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">CRM Integrations</span>}
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSidebarExpanded ? "px-4 py-3 space-x-3" : "p-3 justify-center"
              } ${
                activeTab === "profile"
                  ? "bg-amber-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={!isSidebarExpanded ? "Admin Security & Email" : undefined}
            >
              <User className="w-5 h-5 shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">Admin Security</span>}
            </button>
          </div>

          {/* Sidebar Footer Info */}
          {isSidebarExpanded && (
            <div className="pt-4 border-t border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-400 block">EPLT Administration</span>
              <span className="text-[9px] font-mono text-slate-300 block mt-0.5">Connected to database</span>
            </div>
          )}
        </aside>

        {/* MAIN WORKING CONTENT AREA */}
        <div className="flex-1 min-w-0 w-full space-y-8">
          
          {/* Panel Form Blocks */}
          {editContent && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: GLOBAL AND CONTACT SETTINGS */}
          {activeTab === "global" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="CORPORATE BRAND NAME"
                  name="brandName"
                  value={editContent.brandName}
                  onChange={handleGlobalChange}
                />
                <Input
                  label="BRAND ABBREVIATION"
                  name="brandAbbr"
                  value={editContent.brandAbbr}
                  onChange={handleGlobalChange}
                />
                <Input
                  label="HEADER QUICK-CALL PHONE"
                  name="headerHotline"
                  value={editContent.headerHotline}
                  onChange={handleGlobalChange}
                />
              </div>

              <div className="h-[1px] bg-slate-200"></div>

              {/* Contact Metadata */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-slate-900">Contact & Webhook Routing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="HEADQUARTERS ADDRESS (ENGLISH)"
                    name="address"
                    value={editContent.contact.address}
                    onChange={handleContactChange}
                  />
                  <Input
                    label="HEADQUARTERS ADDRESS (BENGALI)"
                    name="addressBn"
                    value={editContent.contact.addressBn || ""}
                    onChange={handleContactChange}
                  />
                  <Input
                    label="GMAIL NOTIFICATION TARGET"
                    name="email"
                    value={editContent.contact.email}
                    onChange={handleContactChange}
                  />
                  <Input
                    label="HOTLINE PHONE 1"
                    name="hotline1"
                    value={editContent.contact.hotline1}
                    onChange={handleContactChange}
                  />
                  <Input
                    label="HOTLINE PHONE 2"
                    name="hotline2"
                    value={editContent.contact.hotline2}
                    onChange={handleContactChange}
                  />
                </div>
                <Input
                  label="GOOGLE SHEETS APPS SCRIPT WEBHOOK URL (FOR CLOUD DEPLOYMENT)"
                  name="gsheetWebhookUrl"
                  value={editContent.contact.gsheetWebhookUrl}
                  onChange={handleContactChange}
                  className="font-mono text-slate-700 bg-white"
                />
              </div>

              <div className="h-[1px] bg-slate-200"></div>

              {/* About textareas */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-slate-900">Corporate Mission & Vision Statements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <TextArea
                      label="MISSION STATEMENT (ENGLISH)"
                      name="mission"
                      value={editContent.about.mission}
                      onChange={handleAboutChange}
                    />
                    <TextArea
                      label="VISION STATEMENT (ENGLISH)"
                      name="vision"
                      value={editContent.about.vision}
                      onChange={handleAboutChange}
                    />
                    <TextArea
                      label="QUALITY POLICY SUMMARY (ENGLISH)"
                      name="qualityPolicy"
                      value={editContent.about.qualityPolicy}
                      onChange={handleAboutChange}
                    />
                  </div>
                  <div className="space-y-4">
                    <TextArea
                      label="MISSION STATEMENT (BENGALI)"
                      name="missionBn"
                      value={editContent.about.missionBn || ""}
                      onChange={handleAboutChange}
                    />
                    <TextArea
                      label="VISION STATEMENT (BENGALI)"
                      name="visionBn"
                      value={editContent.about.visionBn || ""}
                      onChange={handleAboutChange}
                    />
                    <TextArea
                      label="QUALITY POLICY SUMMARY (BENGALI)"
                      name="qualityPolicyBn"
                      value={editContent.about.qualityPolicyBn || ""}
                      onChange={handleAboutChange}
                    />
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200"></div>

              {/* Materials origins */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-slate-900">Supplier Bill of Materials Origins</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="CRGO SILICON STEEL ORIGIN (ENGLISH)"
                      name="coreOrigin"
                      value={editContent.materials.coreOrigin}
                      onChange={handleMaterialChange}
                    />
                    <Input
                      label="COIL INSULATION PRESSBOARD ORIGIN (ENGLISH)"
                      name="insulationOrigin"
                      value={editContent.materials.insulationOrigin}
                      onChange={handleMaterialChange}
                    />
                    <Input
                      label="DIELECTRIC COOLING OIL ORIGIN (ENGLISH)"
                      name="oilOrigin"
                      value={editContent.materials.oilOrigin}
                      onChange={handleMaterialChange}
                    />
                    <Input
                      label="ELECTROLYTIC COPPER WINDING ORIGIN (ENGLISH)"
                      name="copperOrigin"
                      value={editContent.materials.copperOrigin}
                      onChange={handleMaterialChange}
                    />
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="CRGO SILICON STEEL ORIGIN (BENGALI)"
                      name="coreOriginBn"
                      value={editContent.materials.coreOriginBn || ""}
                      onChange={handleMaterialChange}
                    />
                    <Input
                      label="COIL INSULATION PRESSBOARD ORIGIN (BENGALI)"
                      name="insulationOriginBn"
                      value={editContent.materials.insulationOriginBn || ""}
                      onChange={handleMaterialChange}
                    />
                    <Input
                      label="DIELECTRIC COOLING OIL ORIGIN (BENGALI)"
                      name="oilOriginBn"
                      value={editContent.materials.oilOriginBn || ""}
                      onChange={handleMaterialChange}
                    />
                    <Input
                      label="ELECTROLYTIC COPPER WINDING ORIGIN (BENGALI)"
                      name="copperOriginBn"
                      value={editContent.materials.copperOriginBn || ""}
                      onChange={handleMaterialChange}
                    />
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200"></div>

              {/* Capabilities Manager */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-display font-semibold text-slate-900">Capabilities (Scope of Work)</h3>
                  <span className="text-xs text-slate-500 font-mono">6 Static Categories</span>
                </div>
                <div className="space-y-6">
                  {editContent.capabilities?.map((cap, idx) => (
                    <div key={cap.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-xs font-mono font-bold text-brand-gold uppercase">Category Card {idx + 1}</span>
                        <div className="w-1/3">
                          <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">ICON</label>
                          <select
                            value={cap.iconName || "Zap"}
                            onChange={(e) => {
                              const updated = [...editContent.capabilities];
                              updated[idx] = { ...updated[idx], iconName: e.target.value };
                              setEditContent({ ...editContent, capabilities: updated });
                            }}
                            className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                          >
                            {["Zap", "TrendingUp", "Sliders", "Cpu", "Sun", "Wrench"].map((icon) => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Input
                            label="TITLE (ENGLISH)"
                            value={cap.title}
                            onChange={(e) => {
                              const updated = [...editContent.capabilities];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              setEditContent({ ...editContent, capabilities: updated });
                            }}
                            className="bg-white"
                          />
                          <TextArea
                            label="DESCRIPTION (ENGLISH)"
                            value={cap.description}
                            onChange={(e) => {
                              const updated = [...editContent.capabilities];
                              updated[idx] = { ...updated[idx], description: e.target.value };
                              setEditContent({ ...editContent, capabilities: updated });
                            }}
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-3">
                          <Input
                            label="TITLE (BENGALI)"
                            value={cap.titleBn || ""}
                            onChange={(e) => {
                              const updated = [...editContent.capabilities];
                              updated[idx] = { ...updated[idx], titleBn: e.target.value };
                              setEditContent({ ...editContent, capabilities: updated });
                            }}
                            className="bg-white"
                          />
                          <TextArea
                            label="DESCRIPTION (BENGALI)"
                            value={cap.descriptionBn || ""}
                            onChange={(e) => {
                              const updated = [...editContent.capabilities];
                              updated[idx] = { ...updated[idx], descriptionBn: e.target.value };
                              setEditContent({ ...editContent, capabilities: updated });
                            }}
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-slate-200"></div>

              {/* Page Headings & General Labels Editor */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-slate-900">Page Headings & General Labels</h3>
                <p className="text-xs text-slate-600">Modify any text, section headers, or descriptions appearing throughout the public-facing pages.</p>
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-6">
                  {/* Estimator Heading */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase text-emerald-600">1. Power Factor Calculator & Estimator Title</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="ESTIMATOR TITLE (ENGLISH)"
                        value={editContent.headings?.estimatorTitle || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, estimatorTitle: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <Input
                        label="ESTIMATOR TITLE (BENGALI)"
                        value={editContent.headings?.estimatorTitleBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, estimatorTitleBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextArea
                        label="ESTIMATOR SUBTITLE (ENGLISH)"
                        value={editContent.headings?.estimatorSub || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, estimatorSub: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <TextArea
                        label="ESTIMATOR SUBTITLE (BENGALI)"
                        value={editContent.headings?.estimatorSubBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, estimatorSubBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-200"></div>

                  {/* Materials Heading */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase text-emerald-600">2. Authenticity Guarantee Heading</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="MATERIALS GUARANTEE TITLE (ENGLISH)"
                        value={editContent.headings?.materialsHeading || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, materialsHeading: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <Input
                        label="MATERIALS GUARANTEE TITLE (BENGALI)"
                        value={editContent.headings?.materialsHeadingBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, materialsHeadingBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextArea
                        label="MATERIALS GUARANTEE SUBTITLE (ENGLISH)"
                        value={editContent.headings?.materialsSub || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, materialsSub: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <TextArea
                        label="MATERIALS GUARANTEE SUBTITLE (BENGALI)"
                        value={editContent.headings?.materialsSubBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, materialsSubBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-200"></div>

                  {/* Completed Projects Heading */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase text-emerald-600">3. Completed Projects Heading</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="PROJECTS SECTION TITLE (ENGLISH)"
                        value={editContent.headings?.recentProjectsHeading || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, recentProjectsHeading: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <Input
                        label="PROJECTS SECTION TITLE (BENGALI)"
                        value={editContent.headings?.recentProjectsHeadingBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, recentProjectsHeadingBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextArea
                        label="PROJECTS SECTION SUBTITLE (ENGLISH)"
                        value={editContent.headings?.recentProjectsSub || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, recentProjectsSub: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <TextArea
                        label="PROJECTS SECTION SUBTITLE (BENGALI)"
                        value={editContent.headings?.recentProjectsSubBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, recentProjectsSubBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="h-[1px] bg-slate-200"></div>

                  {/* Contact Heading */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono uppercase text-emerald-600">4. Corporate Desk Contact Heading</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="CONTACT DESK TITLE (ENGLISH)"
                        value={editContent.headings?.contactHeading || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, contactHeading: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <Input
                        label="CONTACT DESK TITLE (BENGALI)"
                        value={editContent.headings?.contactHeadingBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, contactHeadingBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextArea
                        label="CONTACT DESK SUBTITLE (ENGLISH)"
                        value={editContent.headings?.contactSub || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, contactSub: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                      <TextArea
                        label="CONTACT DESK SUBTITLE (BENGALI)"
                        value={editContent.headings?.contactSubBn || ""}
                        onChange={(e) => {
                          setEditContent({
                            ...editContent,
                            headings: { ...editContent.headings, contactSubBn: e.target.value }
                          });
                        }}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-slate-200"></div>

              {/* Admin Credentials Settings */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Change Admin Portal Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="New Admin Username (leave empty to keep current)"
                      type="text"
                      placeholder="Enter new username..."
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-white font-sans"
                    />
                  </div>
                  <div>
                    <Input
                      label="New Admin Password (leave empty to keep current)"
                      type="password"
                      placeholder="Enter new password..."
                      value={newPassphrase}
                      onChange={(e) => setNewPassphrase(e.target.value)}
                      className="bg-white font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO SLIDES EDIT */}
          {activeTab === "hero" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-display font-semibold text-slate-900">Hero Slideshow Editor</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Adjust visual banners and copy displayed on the front-page carousel. Use high-resolution Unsplash images for optimal performance.
                </p>
              </div>

              {editContent.heroSlides.map((slide, idx) => (
                <div key={slide.id} className="p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4 relative">
                  <div className="absolute top-4 right-4 bg-brand-gold/10 px-3 py-1 text-[10px] font-mono text-brand-gold font-bold uppercase tracking-wider rounded">
                    Slide {idx + 1}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Input
                        label="SLIDE TITLE (ENGLISH)"
                        value={slide.title}
                        onChange={(e) => handleHeroSlideChange(idx, "title", e.target.value)}
                        className="bg-white"
                      />
                      <TextArea
                        label="SLIDE SUBTITLE CAPTION (ENGLISH)"
                        value={slide.subtitle}
                        onChange={(e) => handleHeroSlideChange(idx, "subtitle", e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-4">
                      <Input
                        label="SLIDE TITLE (BENGALI)"
                        value={slide.titleBn || ""}
                        onChange={(e) => handleHeroSlideChange(idx, "titleBn", e.target.value)}
                        className="bg-white"
                      />
                      <TextArea
                        label="SLIDE SUBTITLE CAPTION (BENGALI)"
                        value={slide.subtitleBn || ""}
                        onChange={(e) => handleHeroSlideChange(idx, "subtitleBn", e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      label="SLIDE BACKGROUND IMAGE URL"
                      value={slide.bgImage}
                      onChange={(e) => handleHeroSlideChange(idx, "bgImage", e.target.value)}
                      className="font-mono text-xs bg-white"
                    />
                  </div>

                  {/* Tiny live image preview */}
                  <div className="flex items-center space-x-3 p-3 bg-white rounded border border-slate-200">
                    <Image className="w-5 h-5 text-brand-gold shrink-0" />
                    <span className="text-xs text-slate-600 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                      Current Image Link Path: {slide.bgImage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TRANSFORMERS & PRODUCTS INVENTORY MANAGER (CRUD CARD SYSTEM) */}
          {activeTab === "transformers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <Database className="text-plt-green w-5.5 h-5.5" />
                    <span>Product Inventory Manager</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage standard specifications, manufacturing models, and catalog inventory items with real-time web deployment.
                  </p>
                </div>
                
                <Button
                  onClick={() => {
                    setIsAddingProduct(true);
                    setEditingProductIdx(null);
                  }}
                  variant="gold"
                  size="sm"
                  className="flex items-center space-x-1 shrink-0 text-white bg-plt-purple hover:bg-plt-violet border-none shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                  <span>Add New Product Model</span>
                </Button>
              </div>

              {/* SEARCH & FILTERS CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-6 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products by model, losses, efficiency..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-plt-purple text-slate-800"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple"
                  >
                    <option value="all">All Categories</option>
                    <option value="Distribution Transformer">Distribution Transformers</option>
                    <option value="Power Transformer">Power Transformers</option>
                    <option value="PFI Panel">PFI Plants</option>
                    <option value="HT Switchgear">HT Switchgears</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={productSortOrder}
                    onChange={(e) => setProductSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple"
                  >
                    <option value="default">Default Ordering</option>
                    <option value="efficiency-desc">Sort by Efficiency (High → Low)</option>
                    <option value="capacity-asc">Sort by Capacity (Low → High)</option>
                  </select>
                </div>
              </div>

              {/* CREATE INLINE CARD PANEL */}
              {isAddingProduct && (
                <div className="p-6 bg-slate-50 border-2 border-dashed border-plt-purple rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-plt-purple uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Create New Product Model</span>
                    </h4>
                    <button
                      onClick={() => setIsAddingProduct(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      label="Capacity (Model Name)"
                      value={newProductForm.capacity}
                      onChange={(e) => setNewProductForm({ ...newProductForm, capacity: e.target.value })}
                      placeholder="e.g., 500 KVA"
                      className="bg-white font-semibold text-slate-800"
                    />
                    
                    <div className="flex flex-col">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Equipment Category
                      </label>
                      <select
                        value={newProductForm.category || "Distribution Transformer"}
                        onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-plt-purple"
                      >
                        <option value="Distribution Transformer">Distribution Transformer</option>
                        <option value="Power Transformer">Power Transformer</option>
                        <option value="PFI Panel">PFI Panel</option>
                        <option value="HT Switchgear">HT Switchgear</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Status Code
                      </label>
                      <select
                        value={newProductForm.status || "In Stock"}
                        onChange={(e) => setNewProductForm({ ...newProductForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-plt-purple"
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Built to Order">Built to Order</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>

                    <Input
                      label="Efficiency Rating (%)"
                      value={newProductForm.efficiency}
                      onChange={(e) => setNewProductForm({ ...newProductForm, efficiency: e.target.value })}
                      placeholder="e.g., 98.7%"
                      className="bg-white text-slate-800 font-mono"
                    />
                    <Input
                      label="Core & Coil Losses"
                      value={newProductForm.losses}
                      onChange={(e) => setNewProductForm({ ...newProductForm, losses: e.target.value })}
                      placeholder="e.g., 950W (No-Load) / 5500W (Load)"
                      className="bg-white sm:col-span-2 text-slate-800"
                    />
                    <Input
                      label="Voltage Regulation"
                      value={newProductForm.regulation}
                      onChange={(e) => setNewProductForm({ ...newProductForm, regulation: e.target.value })}
                      placeholder="e.g., 2.8%"
                      className="bg-white text-slate-800 font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Oil Vol (L)"
                        value={newProductForm.oil}
                        onChange={(e) => setNewProductForm({ ...newProductForm, oil: e.target.value })}
                        placeholder="410 L"
                        className="bg-white text-slate-800 font-mono"
                      />
                      <Input
                        label="Weight (kg)"
                        value={newProductForm.weight}
                        onChange={(e) => setNewProductForm({ ...newProductForm, weight: e.target.value })}
                        placeholder="2100 kg"
                        className="bg-white text-slate-800 font-mono"
                      />
                    </div>

                    {/* Drag & Drop Product Image Upload */}
                    <div className="md:col-span-4 mt-2">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Product Image (Drag & Drop)
                      </label>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, null)}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-plt-purple hover:bg-white transition-all bg-slate-50/50"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="new-product-image-upload"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, null)}
                        />
                        <label htmlFor="new-product-image-upload" className="cursor-pointer space-y-2 block">
                          {newProductForm.image ? (
                            <div className="flex flex-col items-center">
                              <img src={newProductForm.image} alt="Preview" className="h-24 object-contain rounded-lg border border-slate-200 mb-2 shadow-sm bg-white p-1" />
                              <span className="text-xs text-plt-purple font-semibold font-mono">Image loaded successfully!</span>
                              <span className="text-[10px] text-slate-400">Drag or click to change</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-2">
                              <Image className="w-10 h-10 text-slate-400 mb-2 animate-pulse" />
                              <span className="text-xs text-slate-700 font-semibold">Drag & drop product photo here, or <span className="text-plt-purple underline">browse files</span></span>
                              <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-100 mt-1">Preferred size: 500x500 pixels (1:1 square ratio) under 1 MB. Large photos auto-compressed.</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingProduct(false)}
                      className="border-slate-300 text-slate-700 cursor-pointer animate-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        if (!newProductForm.capacity) {
                          alert("Product Model/Capacity label is required.");
                          return;
                        }
                        const updated = [...editContent.transformers, newProductForm];
                        setEditContent({ ...editContent, transformers: updated });
                        setIsAddingProduct(false);
                        setNewProductForm({
                          capacity: "250 KVA",
                          losses: "520W (No-Load) / 3250W (Load)",
                          regulation: "2.6%",
                          efficiency: "98.5%",
                          oil: "260 L",
                          weight: "1250 kg",
                          status: "In Stock",
                          category: "Distribution Transformer",
                          image: ""
                        });
                        setSaveStatus({ success: true, message: "Added " + newProductForm.capacity + " to local catalog changes. Remember to click 'Save All Changes' at the bottom." });
                      }}
                      className="text-white bg-plt-purple hover:bg-plt-violet border-none cursor-pointer"
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              )}

              {/* READ & UPDATE INLINE CARD GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editContent.transformers.map((item, idx) => {
                  const isEditing = editingProductIdx === idx;
                  const itemCat = item.category || "Distribution Transformer";
                  const itemStatus = item.status || "Built to Order";

                  // Check search filter matches
                  const term = productSearchQuery.toLowerCase();
                  const matchesSearch = item.capacity.toLowerCase().includes(term) ||
                                       item.losses.toLowerCase().includes(term) ||
                                       item.efficiency.toLowerCase().includes(term);
                  
                  const matchesCat = productCategoryFilter === "all" || itemCat.toLowerCase() === productCategoryFilter.toLowerCase();
                  
                  if (!matchesSearch || !matchesCat) return null;

                  return (
                    <div
                      key={idx}
                      className={`p-6 border rounded-xl shadow-sm transition-all flex flex-col justify-between ${
                        isEditing 
                          ? "border-plt-purple bg-purple-50/10" 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      {isEditing ? (
                        /* INLINE CARD UPDATE FORM */
                        <div className="space-y-4 flex-grow">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-plt-purple font-mono uppercase tracking-wider">
                              Editing Product Index #{idx + 1}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">Catalog Ref: #{idx}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <Input
                                label="MODEL NAME / CAPACITY"
                                value={item.capacity}
                                onChange={(e) => handleTransformerChange(idx, "capacity", e.target.value)}
                                className="bg-white font-bold text-slate-800"
                              />
                            </div>

                            <div className="flex flex-col">
                              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Category
                              </label>
                              <select
                                value={itemCat}
                                onChange={(e) => handleTransformerChange(idx, "category", e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-plt-purple"
                              >
                                <option value="Distribution Transformer">Distribution Transformer</option>
                                <option value="Power Transformer">Power Transformer</option>
                                <option value="PFI Panel">PFI Panel</option>
                                <option value="HT Switchgear">HT Switchgear</option>
                              </select>
                            </div>

                            <div className="flex flex-col">
                              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Status
                              </label>
                              <select
                                value={itemStatus}
                                onChange={(e) => handleTransformerChange(idx, "status", e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-plt-purple"
                              >
                                <option value="In Stock">In Stock</option>
                                <option value="Built to Order">Built to Order</option>
                                <option value="Out of Stock">Out of Stock</option>
                              </select>
                            </div>

                            <div className="col-span-2">
                              <Input
                                label="CORE & COIL LOSSES"
                                value={item.losses}
                                onChange={(e) => handleTransformerChange(idx, "losses", e.target.value)}
                                className="bg-white text-slate-800"
                              />
                            </div>

                            <div>
                              <Input
                                label="REGULATION"
                                value={item.regulation}
                                onChange={(e) => handleTransformerChange(idx, "regulation", e.target.value)}
                                className="bg-white font-mono text-slate-800"
                              />
                            </div>

                            <div>
                              <Input
                                label="EFFICIENCY LEVEL"
                                value={item.efficiency}
                                onChange={(e) => handleTransformerChange(idx, "efficiency", e.target.value)}
                                className="bg-white font-mono text-emerald-600 font-bold"
                              />
                            </div>

                            <div>
                              <Input
                                label="COOLANT OIL (L)"
                                value={item.oil}
                                onChange={(e) => handleTransformerChange(idx, "oil", e.target.value)}
                                className="bg-white font-mono text-slate-800"
                              />
                            </div>

                            <div>
                              <Input
                                label="WEIGHT (kg)"
                                value={item.weight}
                                onChange={(e) => handleTransformerChange(idx, "weight", e.target.value)}
                                className="bg-white font-mono text-slate-800"
                              />
                            </div>
                          </div>

                          {/* Drag & Drop Product Image Upload (Editing) */}
                          <div className="mt-3">
                            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Product Image (Drag & Drop)
                            </label>
                            <div
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, idx)}
                              className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:border-plt-purple hover:bg-slate-50 transition-colors"
                            >
                              <input
                                type="file"
                                accept="image/*"
                                id={`file-upload-edit-${idx}`}
                                className="hidden"
                                onChange={(e) => handleFileChange(e, idx)}
                              />
                              <label htmlFor={`file-upload-edit-${idx}`} className="cursor-pointer space-y-1 block">
                                {item.image ? (
                                  <div className="flex flex-col items-center">
                                    <img src={item.image} alt="Preview" className="h-16 object-contain rounded border border-slate-200 mb-1.5 p-0.5 bg-white shadow-sm" />
                                    <span className="text-[10px] text-plt-purple font-bold">Image Loaded</span>
                                    <span className="text-[9px] text-slate-400">Drag or click to change</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center py-1">
                                    <Image className="w-6 h-6 text-slate-400 mb-1" />
                                    <span className="text-[10px] text-slate-700 font-semibold">Drag & drop photo or <span className="text-plt-purple underline">browse</span></span>
                                    <span className="text-[8px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mt-1">Preferred size: 500x500 pixels (1:1 square ratio) under 1 MB. Larger files are compressed.</span>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => setEditingProductIdx(null)}
                              className="px-3.5 py-1.5 bg-plt-purple hover:bg-plt-violet text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Apply Specifications
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* STANDARD READ VIEW */
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            {/* Badges line */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${
                                itemCat === "Distribution Transformer" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                itemCat === "Power Transformer" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {itemCat}
                              </span>

                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                itemStatus === "In Stock" ? "bg-green-100 text-green-800" :
                                itemStatus === "Built to Order" ? "bg-amber-100 text-amber-800" :
                                "bg-rose-100 text-rose-800"
                              }`}>
                                {itemStatus}
                              </span>
                            </div>

                            {/* Product Image Display */}
                            {item.image && (
                              <div className="w-full h-36 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden mb-3.5 flex items-center justify-center p-2 bg-white">
                                <img src={item.image} alt={item.capacity} className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300" />
                              </div>
                            )}

                            {/* Title heading */}
                            <div className="mb-4">
                              <h4 className="text-xl font-bold text-plt-purple font-display tracking-tight flex items-center">
                                <Zap className="w-5 h-5 text-plt-green mr-1.5 shrink-0" />
                                <span>{item.capacity}</span>
                              </h4>
                              <span className="text-slate-400 text-xs font-mono">Catalog Index: #{idx}</span>
                            </div>

                            {/* Specifications breakdown */}
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-mono text-slate-700 mb-4">
                              <div className="col-span-2 border-b border-slate-200 pb-1.5">
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Transformer Losses</span>
                                <span className="font-semibold text-slate-800 text-xs">{item.losses}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Regulation</span>
                                <span className="font-semibold text-slate-800">{item.regulation}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Efficiency</span>
                                <span className="font-bold text-emerald-600">{item.efficiency}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Coolant Oil</span>
                                <span className="font-semibold text-slate-800">{item.oil}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Total Weight</span>
                                <span className="font-semibold text-slate-800">{item.weight}</span>
                              </div>
                            </div>
                          </div>

                          {/* Cards CRUD Action Buttons */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                            <span className="text-[11px] text-slate-400 font-mono">Changes stay local until saved.</span>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingProductIdx(idx)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-plt-purple hover:text-white rounded text-xs font-medium text-slate-700 transition duration-150 cursor-pointer"
                                title="Edit specs"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Modify</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this product catalog entry? " + item.capacity)) {
                                    removeTransformerRow(idx);
                                    setSaveStatus({ success: true, message: "Removed item. Click 'Save All Changes' to deploy changes on server." });
                                  }
                                }}
                                className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 rounded transition duration-150 cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {editContent.transformers.length === 0 && (
                <div className="text-center py-16 text-slate-500 font-mono text-sm border border-dashed border-slate-200 rounded bg-slate-50">
                  <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <span>No products listed in catalog. Click "Add New Product Model" above to create some!</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3.5: RECENT COMPLETED PROJECTS (CRUD SYSTEM) */}
          {activeTab === "recentProjects" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <Briefcase className="text-brand-gold w-5.5 h-5.5" />
                    <span>Completed Substation Installations in Bangladesh</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage and showcase your successfully completed substation installations and custom panels on the homepage.
                  </p>
                </div>

                <div className="flex space-x-2.5 shrink-0">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      setIsAddingProject(!isAddingProject);
                      setEditingProjectIdx(null);
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>{isAddingProject ? "Close Editor" : "Add Completed Project Showcase"}</span>
                  </Button>
                </div>
              </div>

              {/* SEARCH FILTER */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 max-w-md shadow-inner">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search projects by title, client, location..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-slate-800 placeholder-slate-400 border-none outline-none focus:ring-0 w-full"
                />
                {projectSearchQuery && (
                  <button onClick={() => setProjectSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* ADD NEW PROJECT FORM */}
              {isAddingProject && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-3 duration-250 shadow-md">
                  <h4 className="font-display font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center space-x-1.5">
                    <PlusCircle className="w-4 h-4 text-brand-gold" />
                    <span>New Project Showcase Specifications</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* EN Title */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Title (English)</label>
                      <input
                        type="text"
                        value={newProjectForm.title}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                        placeholder="11KV Substation Installation at Rahim Group"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* BN Title */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Title (বাংলা)</label>
                      <input
                        type="text"
                        value={newProjectForm.titleBn}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, titleBn: e.target.value })}
                        placeholder="১১ কেভি টার্নকি সাবস্টেশন স্থাপন - রহিম গ্রুপ"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* EN Client */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Client (English)</label>
                      <input
                        type="text"
                        value={newProjectForm.client}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, client: e.target.value })}
                        placeholder="Rahim Group Ltd."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* BN Client */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Client (বাংলা)</label>
                      <input
                        type="text"
                        value={newProjectForm.clientBn}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, clientBn: e.target.value })}
                        placeholder="রহিম গ্রুপ লিমিটেড"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* EN Location */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Location (English)</label>
                      <input
                        type="text"
                        value={newProjectForm.location}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, location: e.target.value })}
                        placeholder="Gazipur, Bangladesh"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* BN Location */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Location (বাংলা)</label>
                      <input
                        type="text"
                        value={newProjectForm.locationBn}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, locationBn: e.target.value })}
                        placeholder="গাজীপুর, বাংলাদেশ"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* EN Capacity */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Capacity Rating (English)</label>
                      <input
                        type="text"
                        value={newProjectForm.capacity}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, capacity: e.target.value })}
                        placeholder="1500 KVA Substation"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                    </div>

                    {/* BN Capacity */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Capacity Rating (বাংলা)</label>
                      <input
                        type="text"
                        value={newProjectForm.capacityBn}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, capacityBn: e.target.value })}
                        placeholder="১৫০০ কেভিএ সাবস্টেশন"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-sans"
                      />
                    </div>

                    {/* Commissioned Date */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Commissioned Date</label>
                      <input
                        type="text"
                        value={newProjectForm.commissionedDate}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, commissionedDate: e.target.value })}
                        placeholder="2025-11-20"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                    </div>

                    {/* EN Description */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Description (English)</label>
                      <textarea
                        value={newProjectForm.description}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                        placeholder="Designed, manufactured, and installed complete substation..."
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* BN Description */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Description (বাংলা)</label>
                      <textarea
                        value={newProjectForm.descriptionBn}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, descriptionBn: e.target.value })}
                        placeholder="ডিস্ট্রিবিউশন ট্রান্সফরমার এবং পিএফআই প্ল্যান্ট স্থাপন..."
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Project Image Dropzone */}
                    <div className="md:col-span-12 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Photo Image (Drag & Drop or Upload)</label>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleProjectDrop(e, null)}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-gold hover:bg-white transition-all bg-white"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="new-project-image-upload"
                          className="hidden"
                          onChange={(e) => handleProjectFileChange(e, null)}
                        />
                        <label htmlFor="new-project-image-upload" className="cursor-pointer space-y-2 block">
                          {newProjectForm.image ? (
                            <div className="flex flex-col items-center">
                              <img src={newProjectForm.image} alt="Preview" className="h-24 object-contain rounded-lg border border-slate-200 mb-2 shadow-sm bg-white p-1" />
                              <span className="text-xs text-brand-gold font-semibold font-mono">Project image loaded successfully!</span>
                              <span className="text-[10px] text-slate-400">Drag or click to change</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Image className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-xs text-slate-700 font-semibold">Drag & drop project photo here, or <span className="text-brand-gold underline font-bold">browse local files</span></span>
                              <span className="text-[10px] text-slate-400 font-mono text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mt-1 block">Preferred size: 800x500 pixels (landscape ratio) under 1 MB. Larger files are automatically optimized.</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Image URL fallback */}
                    <div className="md:col-span-12 space-y-1">
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Or Input Direct Photo Image URL</label>
                      <input
                        type="text"
                        value={newProjectForm.image}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, image: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingProject(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        if (!newProjectForm.title) {
                          alert("Please enter at least a Project Title.");
                          return;
                        }
                        const randomId = "proj-" + Math.floor(Math.random() * 1000000);
                        const updated = [
                          ...editContent.recentProjects,
                          { ...newProjectForm, id: randomId }
                        ];
                        setEditContent({ ...editContent, recentProjects: updated });
                        setIsAddingProject(false);
                        setNewProjectForm({
                          title: "",
                          titleBn: "",
                          client: "",
                          clientBn: "",
                          location: "",
                          locationBn: "",
                          capacity: "",
                          capacityBn: "",
                          commissionedDate: "",
                          description: "",
                          descriptionBn: "",
                          image: ""
                        });
                        setSaveStatus({ success: true, message: "Added new project. Remember to click 'Save All Changes' below to deploy!" });
                      }}
                      className="cursor-pointer"
                    >
                      Add Project Showcase
                    </Button>
                  </div>
                </div>
              )}

              {/* PROJECT SHOWCASE LIST */}
              <div className="space-y-4">
                {editContent.recentProjects && editContent.recentProjects
                  .filter((p) => {
                    if (!projectSearchQuery) return true;
                    const query = projectSearchQuery.toLowerCase();
                    return (
                      p.title?.toLowerCase().includes(query) ||
                      p.titleBn?.toLowerCase().includes(query) ||
                      p.client?.toLowerCase().includes(query) ||
                      p.clientBn?.toLowerCase().includes(query) ||
                      p.location?.toLowerCase().includes(query) ||
                      p.locationBn?.toLowerCase().includes(query)
                    );
                  })
                  .map((item, idx) => {
                    const isEditing = editingProjectIdx === idx;
                    return (
                      <div
                        key={item.id || idx}
                        className={`bg-white border rounded-2xl p-6 transition duration-150 ${
                          isEditing ? "border-brand-gold ring-1 ring-brand-gold shadow-md" : "border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                              <span className="text-xs font-mono font-bold text-brand-gold uppercase tracking-wider">Editing Project specs</span>
                              <span className="text-xs font-mono text-slate-400">Project ID: {item.id}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              {/* EN Title */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Title (English)</label>
                                <input
                                  type="text"
                                  value={item.title || ""}
                                  onChange={(e) => handleProjectChange(idx, "title", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* BN Title */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Title (বাংলা)</label>
                                <input
                                  type="text"
                                  value={item.titleBn || ""}
                                  onChange={(e) => handleProjectChange(idx, "titleBn", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* EN Client */}
                              <div className="md:col-span-3 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Client (English)</label>
                                <input
                                  type="text"
                                  value={item.client || ""}
                                  onChange={(e) => handleProjectChange(idx, "client", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* BN Client */}
                              <div className="md:col-span-3 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Client (বাংলা)</label>
                                <input
                                  type="text"
                                  value={item.clientBn || ""}
                                  onChange={(e) => handleProjectChange(idx, "clientBn", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* EN Location */}
                              <div className="md:col-span-3 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Location (English)</label>
                                <input
                                  type="text"
                                  value={item.location || ""}
                                  onChange={(e) => handleProjectChange(idx, "location", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* BN Location */}
                              <div className="md:col-span-3 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Location (বাংলা)</label>
                                <input
                                  type="text"
                                  value={item.locationBn || ""}
                                  onChange={(e) => handleProjectChange(idx, "locationBn", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* EN Capacity */}
                              <div className="md:col-span-4 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Capacity Rating (English)</label>
                                <input
                                  type="text"
                                  value={item.capacity || ""}
                                  onChange={(e) => handleProjectChange(idx, "capacity", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                              </div>

                              {/* BN Capacity */}
                              <div className="md:col-span-4 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Capacity Rating (বাংলা)</label>
                                <input
                                  type="text"
                                  value={item.capacityBn || ""}
                                  onChange={(e) => handleProjectChange(idx, "capacityBn", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* Commissioned Date */}
                              <div className="md:col-span-4 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Commissioned Date</label>
                                <input
                                  type="text"
                                  value={item.commissionedDate || ""}
                                  onChange={(e) => handleProjectChange(idx, "commissionedDate", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                              </div>

                              {/* EN Description */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Description (English)</label>
                                <textarea
                                  value={item.description || ""}
                                  onChange={(e) => handleProjectChange(idx, "description", e.target.value)}
                                  rows={3}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* BN Description */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Description (বাংলা)</label>
                                <textarea
                                  value={item.descriptionBn || ""}
                                  onChange={(e) => handleProjectChange(idx, "descriptionBn", e.target.value)}
                                  rows={3}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                              </div>

                              {/* Project Image drag & drop */}
                              <div className="md:col-span-12 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Project Photo Image (Drag & Drop or Upload)</label>
                                <div
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleProjectDrop(e, idx)}
                                  className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-white"
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id={`file-upload-project-${idx}`}
                                    className="hidden"
                                    onChange={(e) => handleProjectFileChange(e, idx)}
                                  />
                                  <label htmlFor={`file-upload-project-${idx}`} className="cursor-pointer space-y-1 block">
                                    {item.image ? (
                                      <div className="flex flex-col items-center">
                                        <img src={item.image} alt="Preview" className="h-20 object-contain rounded border border-slate-200 mb-1.5 p-0.5 bg-white shadow-sm" />
                                        <span className="text-[10px] text-brand-gold font-bold">Project Photo Loaded</span>
                                        <span className="text-[9px] text-slate-400">Drag or click to change</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center py-1">
                                        <Image className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-[10px] text-slate-700 font-semibold">Drag & drop photo or browse</span>
                                        <span className="text-[8px] text-amber-600 font-medium">Preferred size: 800x500 pixels (landscape ratio) under 1 MB. Larger files are compressed.</span>
                                      </div>
                                    )}
                                  </label>
                                </div>
                              </div>

                              {/* Project Image Direct Link */}
                              <div className="md:col-span-12 space-y-1">
                                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Or Input Direct Photo Image URL</label>
                                <input
                                  type="text"
                                  value={item.image || ""}
                                  onChange={(e) => handleProjectChange(idx, "image", e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setEditingProjectIdx(null);
                                  setSaveStatus({ success: true, message: "Applied changes in memory. Remember to click 'Save All Changes' below to save to disk!" });
                                }}
                                className="px-4 py-1.5 bg-brand-gold text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-brand-gold-hover transition-colors shadow-sm"
                              >
                                Done Editing Specs
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                <img
                                  src={item.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800"}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <h4 className="font-display font-bold text-slate-900 leading-tight">
                                  {item.title} <span className="text-slate-400 font-sans text-xs">/ {item.titleBn}</span>
                                </h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                                  <span>Client: <strong className="text-slate-800 font-sans">{item.client} ({item.clientBn})</strong></span>
                                  <span>Location: <strong className="text-slate-800 font-sans">{item.location} ({item.locationBn})</strong></span>
                                  <span>Capacity: <strong className="text-slate-800 font-mono">{item.capacity} ({item.capacityBn})</strong></span>
                                  <span>Commissioned: <strong className="text-slate-800">{item.commissionedDate}</strong></span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                                  {item.description} / {item.descriptionBn}
                                </p>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <button
                                onClick={() => setEditingProjectIdx(idx)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-brand-gold hover:text-white rounded-lg text-xs font-medium text-slate-700 transition duration-150 cursor-pointer w-full sm:w-auto justify-center"
                                title="Edit specs"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Modify</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this completed project showcase? " + item.title)) {
                                    removeProjectRow(idx);
                                    setSaveStatus({ success: true, message: "Removed project showcase. Click 'Save All Changes' below to persist changes." });
                                  }
                                }}
                                className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 rounded-lg transition duration-150 cursor-pointer w-full sm:w-auto flex justify-center"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="sm:hidden ml-1 text-xs font-bold">Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {(!editContent.recentProjects || editContent.recentProjects.length === 0) && (
                  <div className="text-center py-16 text-slate-500 font-mono text-sm border border-dashed border-slate-200 rounded bg-slate-50">
                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
                    <span>No project showcases listed. Click "Add Completed Project Showcase" above to populate!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CLIENT CRM LEADS (CRUD SYSTEM) */}
          {activeTab === "leads" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <Mail className="text-plt-purple w-5.5 h-5.5" />
                    <span>Inquiry Submissions (CRM)</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage client proposals, manual walk-in tickets, and webhook logs with individual CRUD controls.
                  </p>
                </div>

                <div className="flex space-x-2.5 shrink-0">
                  <Button
                    onClick={() => setIsAddingInquiry(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-plt-green" />
                    <span>New CRM Entry</span>
                  </Button>

                  <Button
                    onClick={fetchInquiries}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    disabled={loadingInquiries}
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingInquiries ? "animate-spin text-slate-500" : "text-slate-500"}`} />
                    <span>Sync</span>
                  </Button>

                  <Button
                    onClick={handleClearInquiries}
                    variant="danger"
                    size="sm"
                    className="flex items-center space-x-1 cursor-pointer"
                    disabled={inquiries.length === 0}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Clear Logs</span>
                  </Button>
                </div>
              </div>

              {/* SEARCH & FILTER BAR FOR INQUIRIES */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-8 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search client leads by name, email, requirements..."
                    value={inquirySearchQuery}
                    onChange={(e) => setInquirySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-plt-purple text-slate-800"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={inquiryStatusFilter}
                    onChange={(e) => setInquiryStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple"
                  >
                    <option value="all">All Statuses</option>
                    <option value="New">Status: New</option>
                    <option value="Contacted">Status: Contacted</option>
                    <option value="In Progress">Status: In Progress</option>
                    <option value="Completed">Status: Completed</option>
                    <option value="Archived">Status: Archived</option>
                  </select>
                </div>
              </div>

              {/* CREATE MANUAL INQUIRY MODAL/CARD */}
              {isAddingInquiry && (
                <form
                  onSubmit={handleCreateInquiryOnServer}
                  className="p-6 bg-slate-50 border-2 border-dashed border-plt-green rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-plt-green font-mono uppercase tracking-wider flex items-center space-x-1.5">
                      <Plus className="w-4.5 h-4.5" />
                      <span>Record Walk-in / Direct CRM Inquiry</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingInquiry(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Client Contact Name"
                      required
                      value={newInquiryForm.name}
                      onChange={(e) => setNewInquiryForm({ ...newInquiryForm, name: e.target.value })}
                      placeholder="e.g., General Manager, Beximco"
                      className="bg-white text-slate-800"
                    />
                    <Input
                      label="Client Email Address"
                      type="email"
                      required
                      value={newInquiryForm.email}
                      onChange={(e) => setNewInquiryForm({ ...newInquiryForm, email: e.target.value })}
                      placeholder="e.g., procurement@beximco.com"
                      className="bg-white text-slate-800"
                    />
                    <Input
                      label="Client Hotline / Phone"
                      required
                      value={newInquiryForm.phone}
                      onChange={(e) => setNewInquiryForm({ ...newInquiryForm, phone: e.target.value })}
                      placeholder="e.g., +8801700000000"
                      className="bg-white text-slate-800 font-mono"
                    />
                  </div>

                  <TextArea
                    label="Project Requirements Details"
                    value={newInquiryForm.requirements}
                    onChange={(e) => setNewInquiryForm({ ...newInquiryForm, requirements: e.target.value })}
                    placeholder="Provide transformer capacity requested, panel configurations, delivery deadlines..."
                    rows={3}
                    className="bg-white text-slate-800"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                        Initial Ticket Status
                      </label>
                      <select
                        value={newInquiryForm.status}
                        onChange={(e) => setNewInquiryForm({ ...newInquiryForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-plt-purple"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    <Input
                      label="Internal Executive Follow-up Notes"
                      value={newInquiryForm.adminNotes}
                      onChange={(e) => setNewInquiryForm({ ...newInquiryForm, adminNotes: e.target.value })}
                      placeholder="e.g., Scheduled technical call for Monday morning."
                      className="bg-white text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingInquiry(false)}
                      className="border-slate-300 text-slate-700 cursor-pointer animate-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="gold"
                      size="sm"
                      className="text-white bg-plt-green hover:bg-green-700 border-none cursor-pointer"
                      disabled={loadingInquiries}
                    >
                      Create Entry
                    </Button>
                  </div>
                </form>
              )}

              {/* READ & UPDATE INQUIRIES LIST OF CARDS */}
              <div className="space-y-4">
                {inquiries.map((lead) => {
                  const leadStatus = lead.status || "New";
                  const leadAdminNotes = lead.adminNotes || "";

                  // Search & Filter
                  const term = inquirySearchQuery.toLowerCase();
                  const nameMatch = lead.name.toLowerCase().includes(term);
                  const emailMatch = lead.email.toLowerCase().includes(term);
                  const phoneMatch = lead.phone.toLowerCase().includes(term);
                  const reqMatch = (lead.requirements || "").toLowerCase().includes(term);
                  const searchMatch = nameMatch || emailMatch || phoneMatch || reqMatch;

                  const matchesStatusFilter = inquiryStatusFilter === "all" || leadStatus.toLowerCase() === inquiryStatusFilter.toLowerCase();

                  if (!searchMatch || !matchesStatusFilter) return null;

                  const isEditingCRM = editingInquiryId === lead.id;

                  // Define status styling classes
                  const getStatusClasses = (status) => {
                    switch (status.toLowerCase()) {
                      case "new":
                        return "bg-rose-50 text-rose-700 border-rose-200";
                      case "contacted":
                        return "bg-blue-50 text-blue-700 border-blue-200";
                      case "in progress":
                        return "bg-amber-50 text-amber-700 border-amber-200";
                      case "completed":
                        return "bg-emerald-50 text-emerald-700 border-emerald-200";
                      default:
                        return "bg-slate-50 text-slate-700 border-slate-200";
                    }
                  };

                  return (
                    <div
                      key={lead.id}
                      className={`p-6 border rounded-xl shadow-sm transition-all flex flex-col justify-between ${
                        isEditingCRM
                          ? "border-plt-purple bg-purple-50/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      {isEditingCRM ? (
                        /* INLINE CARD CRM EDIT FORM */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-plt-purple font-mono uppercase tracking-wider flex items-center space-x-1">
                              <Edit className="w-3.5 h-3.5" />
                              <span>Modify CRM Lead Profile</span>
                            </span>
                            <span className="text-xs text-slate-400 font-mono">Lead ID: {lead.id}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                              label="Client Name"
                              value={editingInquiryForm.name}
                              onChange={(e) => setEditingInquiryForm({ ...editingInquiryForm, name: e.target.value })}
                              className="bg-white font-semibold text-slate-800"
                            />
                            <Input
                              label="Client Email"
                              value={editingInquiryForm.email}
                              onChange={(e) => setEditingInquiryForm({ ...editingInquiryForm, email: e.target.value })}
                              className="bg-white text-slate-800"
                            />
                            <Input
                              label="Client Phone"
                              value={editingInquiryForm.phone}
                              onChange={(e) => setEditingInquiryForm({ ...editingInquiryForm, phone: e.target.value })}
                              className="bg-white font-mono text-slate-800"
                            />
                          </div>

                          <TextArea
                            label="Requirements"
                            value={editingInquiryForm.requirements}
                            onChange={(e) => setEditingInquiryForm({ ...editingInquiryForm, requirements: e.target.value })}
                            rows={3}
                            className="bg-white text-slate-800"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                                CRM Engagement Status
                              </label>
                              <select
                                value={editingInquiryForm.status}
                                onChange={(e) => setEditingInquiryForm({ ...editingInquiryForm, status: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-plt-purple"
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Archived">Archived</option>
                              </select>
                            </div>

                            <Input
                              label="Internal Follow-up Notes"
                              value={editingInquiryForm.adminNotes}
                              onChange={(e) => setEditingInquiryForm({ ...editingInquiryForm, adminNotes: e.target.value })}
                              className="bg-white text-slate-800"
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingInquiryId(null);
                                setEditingInquiryForm(null);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleUpdateInquiryOnServer(lead.id, editingInquiryForm);
                                setEditingInquiryId(null);
                                setEditingInquiryForm(null);
                              }}
                              className="px-4 py-1.5 bg-plt-purple hover:bg-plt-violet text-white rounded text-xs font-bold transition duration-150 cursor-pointer"
                            >
                              Save CRM Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* READ-ONLY VIEW OF THE LEAD CARD */
                        <div className="space-y-4">
                          {/* Header section */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 pb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-bold text-plt-purple font-display">{lead.name}</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs text-slate-400 font-mono">ID: {lead.id}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Direct Interactive Quick Status Selector */}
                              <label className="text-[10px] font-mono text-slate-400 mr-1 uppercase">Quick Status:</label>
                              <select
                                value={leadStatus}
                                onChange={(e) => handleUpdateInquiryOnServer(lead.id, { status: e.target.value })}
                                className={`px-2.5 py-1 text-xs font-bold border rounded-full font-mono cursor-pointer transition-colors ${getStatusClasses(leadStatus)}`}
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Archived">Archived</option>
                              </select>
                            </div>
                          </div>

                          {/* Contact Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-plt-purple shrink-0" />
                              <span className="text-slate-500 mr-1 font-semibold">Email:</span>
                              <a href={`mailto:${lead.email}`} className="text-plt-purple font-semibold hover:underline">
                                {lead.email}
                              </a>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-plt-green shrink-0" />
                              <span className="text-slate-500 mr-1 font-semibold">Phone:</span>
                              <a href={`tel:${lead.phone}`} className="text-plt-green font-semibold hover:underline">
                                {lead.phone}
                              </a>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-slate-500 mr-1 font-semibold">Log Date:</span>
                              <span className="text-slate-700 font-semibold">{new Date(lead.timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Requirements message block */}
                          <div className="p-3 bg-white rounded border border-slate-200">
                            <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Client Message / Technical Requirements
                            </h5>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                              {lead.requirements || <span className="italic text-slate-400">No message details provided.</span>}
                            </p>
                          </div>

                          {/* CRM Admin Executive follow up notes */}
                          <div className="p-3 bg-purple-50/30 rounded border border-[#714B9D]/15 space-y-2">
                            <h5 className="text-[10px] font-mono font-bold text-[#714B9D] uppercase tracking-widest flex items-center space-x-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Executive Follow-up Log</span>
                            </h5>
                            
                            <p className="text-xs text-slate-700 leading-relaxed italic font-sans">
                              {leadAdminNotes || <span className="text-slate-400 font-normal">No executive logs recorded yet. Click Modify to add follow-up records.</span>}
                            </p>
                          </div>

                          {/* CRM Actions row */}
                          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingInquiryId(lead.id);
                                setEditingInquiryForm({
                                  name: lead.name,
                                  email: lead.email,
                                  phone: lead.phone,
                                  requirements: lead.requirements || "",
                                  status: leadStatus,
                                  adminNotes: leadAdminNotes
                                });
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-plt-purple hover:text-white rounded text-xs font-semibold text-slate-700 transition duration-150 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Modify Lead Profile</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteInquiryOnServer(lead.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded text-xs font-semibold transition border border-rose-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {inquiries.length === 0 && (
                  <div className="text-center py-16 text-slate-500 font-mono text-sm border border-dashed border-slate-200 rounded bg-slate-50">
                    <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <span>{loadingInquiries ? "Synchronizing inquiries database..." : "No client inquiries found."}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <Share2 className="text-plt-purple w-5.5 h-5.5" />
                    <span>External CRM Integrations</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Configure Google Sheets Webhooks and Gmail Email Notification services to forward leads instantly as they arrive.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Sheets Apps Script Integration */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Google Sheets Integration</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Forward leads directly to spreadsheets</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                        Google Sheets Webhook URL
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id="gsheet-enabled-checkbox"
                          checked={editContent?.contact?.gsheetEnabled !== false}
                          onChange={(e) => {
                            setEditContent({
                              ...editContent,
                              contact: {
                                ...editContent.contact,
                                gsheetEnabled: e.target.checked
                              }
                            });
                          }}
                          className="rounded text-plt-purple focus:ring-plt-purple cursor-pointer"
                        />
                        <label htmlFor="gsheet-enabled-checkbox" className="text-[11px] font-semibold text-slate-600 cursor-pointer">
                          Enabled
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editContent?.contact?.gsheetWebhookUrl || ""}
                      onChange={(e) => {
                        setEditContent({
                          ...editContent,
                          contact: {
                            ...editContent.contact,
                            gsheetWebhookUrl: e.target.value
                          }
                        });
                      }}
                      placeholder="e.g. https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-mono"
                    />
                  </div>

                  {/* Toggle Instructions Accoridon */}
                  <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                    <div className="p-3 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 font-mono uppercase tracking-wide">
                        Implementation Guide
                      </span>
                    </div>
                    <div className="p-4 text-xs text-slate-600 space-y-3 font-sans leading-relaxed">
                      <p>
                        Follow these steps to feed incoming lead inquiry submissions directly into any Google Spreadsheet in real time:
                      </p>
                      <ol className="list-decimal pl-4 space-y-2 text-slate-700">
                        <li>Create a new Google Sheet & name columns in row 1: <strong>Timestamp, Name, Email, Phone, Technical Requirements</strong>.</li>
                        <li>Navigate to <strong>Extensions &gt; Apps Script</strong>.</li>
                        <li>Delete any existing code and paste this secure JavaScript Apps Script handler:</li>
                      </ol>

                      <div className="relative mt-2">
                        <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[10px] overflow-x-auto font-mono max-h-48 whitespace-pre-wrap">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Append headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Technical Requirements"]);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name,
      data.email,
      data.phone,
      data.requirements
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Technical Requirements"]);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name,
      data.email,
      data.phone,
      data.requirements
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`);
                            alert("Google Apps Script code snippet copied to clipboard.");
                          }}
                          className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-mono flex items-center space-x-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>

                      <ol className="list-decimal pl-4 space-y-2 text-slate-700" start="4">
                        <li>Click <strong>Save</strong> and select <strong>Deploy &gt; New deployment</strong>.</li>
                        <li>Choose <strong>Web App</strong>. Set "Execute as" to <strong>Me (your email)</strong> and "Who has access" to <strong>Anyone</strong> (this is safe and required for API access).</li>
                        <li>Copy the generated <strong>Web App URL</strong> and paste it into the Webhook input above, then hit save below.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Gmail SMTP Notifications Settings */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">Gmail Alert Forwarder</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Receive real-time notification alerts via email</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
                        Gmail Alerts Service
                      </span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          id="gmail-enabled-checkbox"
                          checked={editContent?.contact?.gmailEnabled === true}
                          onChange={(e) => {
                            setEditContent({
                              ...editContent,
                              contact: {
                                ...editContent.contact,
                                gmailEnabled: e.target.checked
                              }
                            });
                          }}
                          className="rounded text-plt-purple focus:ring-plt-purple cursor-pointer"
                        />
                        <label htmlFor="gmail-enabled-checkbox" className="text-[11px] font-semibold text-slate-600 cursor-pointer">
                          Enabled
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Gmail Sender Account
                        </label>
                        <input
                          type="email"
                          value={editContent?.contact?.gmailSender || ""}
                          onChange={(e) => {
                            setEditContent({
                              ...editContent,
                              contact: {
                                ...editContent.contact,
                                gmailSender: e.target.value
                              }
                            });
                          }}
                          placeholder="your-account@gmail.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Target Notification Email
                        </label>
                        <input
                          type="email"
                          value={editContent?.contact?.gmailTarget || ""}
                          onChange={(e) => {
                            setEditContent({
                              ...editContent,
                              contact: {
                                ...editContent.contact,
                                gmailTarget: e.target.value
                              }
                            });
                          }}
                          placeholder="sales-team@company.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Google App Password</span>
                          <span className="text-[9px] text-amber-600 normal-case">Never share your real password!</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={editContent?.contact?.gmailAppPassword || ""}
                            onChange={(e) => {
                              setEditContent({
                                ...editContent,
                                contact: {
                                  ...editContent.contact,
                                  gmailAppPassword: e.target.value
                                }
                              });
                            }}
                            placeholder="xxxx xxxx xxxx xxxx"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-mono"
                          />
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gmail Guide accordion */}
                  <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                    <div className="p-3 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 font-mono uppercase tracking-wide">
                        App Password Setup Guide
                      </span>
                    </div>
                    <div className="p-4 text-xs text-slate-600 space-y-3 font-sans leading-relaxed">
                      <p>
                        Gmail SMTP requires a secure 16-character Google App Password rather than your primary email password:
                      </p>
                      <ol className="list-decimal pl-4 space-y-2 text-slate-700">
                        <li>Go to your <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="text-plt-purple underline font-semibold">Google Account Security page</a>.</li>
                        <li>Ensure <strong>2-Step Verification</strong> is enabled under "How you sign in to Google".</li>
                        <li>Search for <strong>App passwords</strong> in the top search bar, or navigate to 2-Step Verification &gt; App Passwords.</li>
                        <li>Click <strong>Generate</strong> (choose "Other" name, e.g. "EPLT Systems Portal").</li>
                        <li>Copy the generated 16-letter code (no spaces) and paste it into the <strong>Google App Password</strong> field above.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
                    <User className="text-amber-600 w-5.5 h-5.5" />
                    <span>Admin Security & Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage your administrative credentials, dispatch password recovery emails, or change your registered contact email address.
                  </p>
                </div>
              </div>

              {securityMessage && (
                <div className={`p-4 rounded-xl flex items-start space-x-3 text-sm leading-relaxed ${
                  securityMessage.success ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"
                }`}>
                  {securityMessage.success ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <span>{securityMessage.text}</span>
                  </div>
                </div>
              )}

              {/* Identity & Status Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 shadow-inner">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">Current Administrator</span>
                    <h4 className="text-lg font-bold text-slate-800 break-all font-sans leading-none mt-1">
                      {user?.email || "No Email Bound"}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      UID: <span className="text-slate-700 select-all">{user?.uid || "N/A"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleTriggerResetEmailInDashboard}
                    disabled={securityLoading}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${securityLoading ? "animate-spin" : ""}`} />
                    <span>Send Reset Email</span>
                  </button>
                </div>
              </div>

              {/* Reauthentication Modal/Prompt */}
              {reauthType && (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-amber-100 pb-3">
                    <Lock className="w-5 h-5 text-amber-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Please Verify Your Password</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Required to apply recent changes</p>
                    </div>
                  </div>

                  <form onSubmit={handleReauthenticate} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPasswordValue}
                        onChange={(e) => setCurrentPasswordValue(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        variant="gold"
                        size="sm"
                        disabled={securityLoading}
                        className="text-white font-semibold cursor-pointer"
                      >
                        {securityLoading ? "Verifying..." : "Confirm & Apply Change"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setReauthType("");
                          setCurrentPasswordValue("");
                          setSecurityMessage(null);
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Forms Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Change Email Form */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-slate-500" />
                      <span>Change Gmail/Email</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Updates registered administrative login email</p>
                  </div>

                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        New Administrative Email
                      </label>
                      <input
                        type="email"
                        required
                        value={changeEmailValue}
                        onChange={(e) => setChangeEmailValue(e.target.value)}
                        placeholder="new-admin@eplt.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-mono"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="gold"
                      size="sm"
                      disabled={securityLoading}
                      className="text-white font-semibold cursor-pointer"
                    >
                      <span>Update Email</span>
                    </Button>
                  </form>
                </div>

                {/* Change Password Form */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                        <Lock className="w-5 h-5 text-slate-500" />
                        <span>Change Password</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {isOtpMode ? "Reset securely using email OTP verification" : "Change current administration credentials password"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpMode(!isOtpMode);
                        setOtpStep(1);
                        setSecurityMessage(null);
                        setOtpValue("");
                      }}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {isOtpMode ? "Use Current Password" : "Forgot Password? (Use OTP)"}
                    </button>
                  </div>

                  {!isOtpMode ? (
                    // Standard Password Change Form
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={changePasswordValue}
                          onChange={(e) => setChangePasswordValue(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPasswordValue}
                          onChange={(e) => setConfirmPasswordValue(e.target.value)}
                          placeholder="Retype password"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-plt-purple font-sans"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <Button
                          type="submit"
                          variant="gold"
                          size="sm"
                          disabled={securityLoading}
                          className="text-white font-semibold cursor-pointer"
                        >
                          <span>Update Password</span>
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpMode(true);
                            setOtpStep(1);
                            setSecurityMessage(null);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 text-left transition-colors cursor-pointer"
                        >
                          Forgot current password? Reset with OTP instead →
                        </button>
                      </div>
                    </form>
                  ) : (
                    // OTP Password Reset Flow
                    <div className="space-y-4">
                      {otpStep === 1 ? (
                        <div className="space-y-4 py-2">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            No worries if you forgot your current password. We will send a secure 6-digit OTP verification code to your registered email address:
                          </p>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 font-semibold break-all text-center">
                            {user?.email || "sadiajahanbristy2019@gmail.com"}
                          </div>
                          <Button
                            type="button"
                            onClick={handleRequestOtp}
                            variant="gold"
                            size="sm"
                            disabled={securityLoading}
                            className="w-full text-white font-semibold cursor-pointer py-2.5"
                          >
                            {securityLoading ? "Generating Security Code..." : "Send Verification OTP"}
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                          {otpSandboxCode && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                              <span className="text-[9px] font-mono font-bold text-amber-800 uppercase tracking-wider block">Sandbox Preview OTP Code</span>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg font-bold text-slate-800 select-all tracking-widest">{otpSandboxCode}</span>
                                <span className="text-[10px] text-amber-700 font-medium">Auto-generated sandbox code</span>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                              6-Digit Verification Code (OTP)
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              pattern="\d{6}"
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                              placeholder="e.g. 123456"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest text-center text-lg font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={changePasswordValue}
                              onChange={(e) => setChangePasswordValue(e.target.value)}
                              placeholder="Min. 6 characters"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              required
                              minLength={6}
                              value={confirmPasswordValue}
                              onChange={(e) => setConfirmPasswordValue(e.target.value)}
                              placeholder="Retype new password"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                            />
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <Button
                              type="submit"
                              variant="gold"
                              size="sm"
                              disabled={securityLoading}
                              className="flex-1 text-white font-semibold cursor-pointer"
                            >
                              {securityLoading ? "Verifying OTP..." : "Verify & Reset Password"}
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setOtpStep(1);
                                setOtpValue("");
                                setOtpSandboxCode("");
                                setSecurityMessage(null);
                              }}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              Resend OTP
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deploy Changes Footer Action */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Database className="text-brand-gold w-5 h-5 shrink-0" />
          <p className="text-xs text-slate-600 leading-normal max-w-xl">
            Save adjustments to synchronize content across the website immediately. This modifies the saved configuration database.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={handleSaveAllChanges}
          disabled={loading}
          className="flex items-center space-x-1.5 w-full sm:w-auto text-white font-semibold cursor-pointer"
        >
          <Save className="w-4 h-4 text-white" />
          <span>Save All Changes</span>
        </Button>
      </div>

        </div> {/* Close MAIN WORKING CONTENT AREA */}
      </div> {/* Close Dashboard Layout Container */}

    </div>
  );
}
