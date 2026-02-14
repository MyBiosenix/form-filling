import React, { useEffect, useMemo, useState } from "react";
import "../styles/profile.css";
import { FaUserCircle } from "react-icons/fa";
import { FiMail, FiPhone, FiPackage, FiCalendar, FiTag } from "react-icons/fi";

function getInitials(name = "") {
  const parts = String(name).trim().split(" ").filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

function formatDateIN(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN");
}

function formatPrice(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n);
}

function daysLeft(expiry) {
  if (!expiry) return null;
  const d = new Date(expiry);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ProfileComp() {
  const [myUser, setMyUser] = useState(null);

  useEffect(() => {
    const users = localStorage.getItem("user");
    if (users) {
      try {
        setMyUser(JSON.parse(users));
      } catch {
        setMyUser(null);
      }
    }
  }, []);

  const initials = useMemo(() => getInitials(myUser?.name), [myUser?.name]);

  const packageText = useMemo(() => {
    const p = myUser?.packages;
    if (!p) return "-";
    if (Array.isArray(p)) return p.map((x) => x?.name ?? x).join(", ");
    if (typeof p === "object") return p?.name ?? "-";
    return String(p);
  }, [myUser?.packages]);

  const validityText = useMemo(() => formatDateIN(myUser?.expiry), [myUser?.expiry]);

  const dleft = useMemo(() => daysLeft(myUser?.expiry), [myUser?.expiry]);
  const isExpired = typeof dleft === "number" ? dleft < 0 : false;

  if (!myUser) return <p className="profileLoading">Loading Profile...</p>;

  return (
    <div className="profileShell">
      <div className="proProfileCard">
        {/* LEFT PANEL */}
        <aside className="ppLeft">
          <div className="ppAvatar">
            <FaUserCircle className="ppUserIcon" />
            <div className="ppInitials" aria-hidden="true">
              {initials}
            </div>
          </div>

          <h2 className="ppName">{myUser?.name || "User"}</h2>
          <p className="ppRole">{packageText !== "-" ? packageText : "Member"}</p>

          <div className="ppBadges">
            <span className={`ppBadge ${isExpired ? "danger" : "success"}`}>
              {isExpired ? "Expired" : "Active"}
            </span>

            {typeof dleft === "number" && !isExpired ? (
              <span className="ppBadge ghost">{dleft} days left</span>
            ) : null}
          </div>

         
        </aside>

        {/* RIGHT PANEL */}
        <section className="ppRight">
          <div className="ppRightHead">
            <div>
              <h3 className="ppTitle">Information</h3>
              <p className="ppSub">
                Your account details shown below
              </p>
            </div>
          </div>

          <div className="ppGrid">
            <div className="ppItem">
              <div className="ppLabel">
                <FiMail /> Email
              </div>
              <div className="ppValue">{myUser?.email || "-"}</div>
            </div>

            <div className="ppItem">
              <div className="ppLabel">
                <FiPhone /> Phone
              </div>
              <div className="ppValue">{myUser?.mobile || "-"}</div>
            </div>

            <div className="ppItem">
              <div className="ppLabel">
                <FiPackage /> Package
              </div>
              <div className="ppValue">{packageText}</div>
            </div>

            <div className="ppItem">
              <div className="ppLabel">
                <FiTag /> Price
              </div>
              <div className="ppValue">{formatPrice(myUser?.price)}</div>
            </div>

            <div className="ppItem full">
              <div className="ppLabel">
                <FiCalendar /> Validity
              </div>
              <div className="ppValue">
                {validityText}
                {typeof dleft === "number" ? (
                  <span className={`ppMiniNote ${isExpired ? "danger" : ""}`}>
                    {isExpired ? ` • Expired ${Math.abs(dleft)} days ago` : ` • ${dleft} days remaining`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
