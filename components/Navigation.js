'use client';

import Link from 'next/link';
import { useState } from 'react';

export function TopNav({ user, role, schoolYearLabel, logoutAction }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const syLabel = schoolYearLabel || 'School Year Not Set';

  return (
    <nav className="topnav">
      <div className="nav-logo">
        <div className="dot">A</div>
        ARAL Monitor
        {role === 'admin' && <span className="admin-tag">Admin</span>}
      </div>
      <div className="nav-right">
        <span className="nav-badge">{syLabel}</span>
        <div
          className="nav-avatar"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          {user?.initials || 'U'}
          {dropdownOpen && (
            <div className="dropdown">
              <div className="dropdown-user">{user?.name}</div>
              {logoutAction ? (
                <form action={logoutAction} className="dropdown-form">
                  <button type="submit" className="logout">
                    Log out
                  </button>
                </form>
              ) : (
                <Link href={role === 'admin' ? '/admin/logout' : '/teacher/logout'} className="logout">
                  Log out
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Sidebar({ role, activeItem, onNavigate, counts = {} }) {
  const teacherItems = [
    {
      section: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
        { id: 'students', label: 'Students', icon: 'LS', count: counts.students },
        { id: 'attendance', label: 'Attendance', icon: 'AT' }
      ]
    },
    {
      section: 'Trackers',
      items: [
        { id: 'reading', label: 'Reading', icon: 'RD' },
        { id: 'irip', label: 'IRIP', icon: 'IR' }
      ]
    },
    {
      section: 'Reports',
      items: [{ id: 'reports', label: 'Reports', icon: 'RP' }]
    },
    {
      section: 'Settings',
      items: [
        { id: 'announcements', label: 'Announcements', icon: 'AN' },
        { id: 'setup', label: 'Class Setup', icon: 'ST', link: '/teacher/setup' }
      ]
    }
  ];

  const adminItems = [
    {
      section: 'Overview',
      items: [{ id: 'overview', label: 'Dashboard', icon: 'DB' }]
    },
    {
      section: 'Management',
      items: [
        { id: 'teachers', label: 'Teachers', icon: 'TC', count: counts.teachers },
        { id: 'sections', label: 'Sections', icon: 'SE', count: counts.sections }
      ]
    },
    {
      section: 'Monitoring',
      items: [
        { id: 'attendance', label: 'Attendance', icon: 'AT' },
        { id: 'interventions', label: 'Interventions', icon: 'IN', count: counts.interventions, alert: true },
        { id: 'irip', label: 'IRIP Inbox', icon: 'IR', count: counts.irip }
      ]
    },
    {
      section: 'Communication',
      items: [{ id: 'announcements', label: 'Announcements', icon: 'AN', count: counts.announcements }]
    },
    {
      section: 'Reports',
      items: [{ id: 'reports', label: 'Reports', icon: 'RP' }]
    }
  ];

  const sections = role === 'admin' ? adminItems : teacherItems;

  return (
    <aside className="sidebar">
      {sections.map((section) => (
        <div key={section.section}>
          <div className="sidebar-section">{section.section}</div>
          {section.items.map((item) => {
            const isActive = activeItem === item.id;

            if (item.link) {
              return (
                <Link key={item.id} href={item.link} className={`nav-item ${isActive ? 'active' : ''}`}>
                  <span className="icon">{item.icon}</span> {item.label}
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate && onNavigate(item.id)}
              >
                <span className="icon">{item.icon}</span> {item.label}
                {item.count !== undefined ? (
                  <span className={`nav-count ${item.alert ? 'alert' : ''}`}>{item.count}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
