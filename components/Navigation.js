'use client';

import {
  faBookOpenReader,
  faBullhorn,
  faCalculator,
  faCalendarCheck,
  faChartColumn,
  faChalkboardUser,
  faComments,
  faFileLines,
  faGaugeHigh,
  faLayerGroup,
  faSchool,
  faSliders,
  faTriangleExclamation,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useState } from 'react';

const ICON_MAP = {
  dashboard: faGaugeHigh,
  students: faUsers,
  attendance: faCalendarCheck,
  reading: faBookOpenReader,
  numeracy: faCalculator,
  comprehension: faComments,
  irip: faFileLines,
  reports: faChartColumn,
  announcements: faBullhorn,
  setup: faSliders,
  teachers: faChalkboardUser,
  sections: faLayerGroup,
  interventions: faTriangleExclamation
};

export function UiIcon({ name }) {
  return <FontAwesomeIcon icon={ICON_MAP[name] || faGaugeHigh} aria-hidden="true" />;
}

function AppMark({ role }) {
  return (
    <span className={`app-mark ${role === 'admin' ? 'admin' : ''}`}>
      <FontAwesomeIcon icon={faSchool} aria-hidden="true" />
    </span>
  );
}

function RenderNavItem({ item, isActive, onNavigate }) {
  const content = (
    <>
      <span className="icon">
        <UiIcon name={item.icon} />
      </span>
      <span className="nav-label">{item.label}</span>
      {item.count !== undefined ? (
        <span className={`nav-count ${item.alert ? 'alert' : ''}`}>{item.count}</span>
      ) : null}
    </>
  );

  if (item.link) {
    return (
      <Link key={item.id} href={item.link} className={`nav-item ${isActive ? 'active' : ''}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      key={item.id}
      type="button"
      className={`nav-item ${isActive ? 'active' : ''}`}
      onClick={() => onNavigate && onNavigate(item.id)}
    >
      {content}
    </button>
  );
}

export function TopNav({ user, role, schoolYearLabel, logoutAction }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const syLabel = schoolYearLabel || 'School Year Not Set';

  return (
    <nav className="topnav">
      <div className="nav-logo">
        <AppMark role={role} />
        <div className="nav-logo-copy">
          <span className="nav-logo-title">ARAL Monitor</span>
          <span className="nav-logo-subtitle">
            {role === 'admin' ? 'School oversight workspace' : 'Teacher intervention workspace'}
          </span>
        </div>
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
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'students', label: 'Students', icon: 'students', count: counts.students },
        { id: 'attendance', label: 'Attendance', icon: 'attendance' }
      ]
    },
    {
      section: 'Trackers',
      items: [
        { id: 'reading', label: 'Reading', icon: 'reading' },
        { id: 'numeracy', label: 'Numeracy', icon: 'numeracy' },
        { id: 'comprehension', label: 'Comprehension', icon: 'comprehension' },
        { id: 'irip', label: 'IRIP', icon: 'irip' }
      ]
    },
    {
      section: 'Reports',
      items: [{ id: 'reports', label: 'Reports', icon: 'reports' }]
    },
    {
      section: 'Settings',
      items: [
        { id: 'announcements', label: 'Announcements', icon: 'announcements' },
        { id: 'setup', label: 'Class Setup', icon: 'setup', link: '/teacher/setup' }
      ]
    }
  ];

  const adminItems = [
    {
      section: 'Overview',
      items: [{ id: 'overview', label: 'Dashboard', icon: 'dashboard' }]
    },
    {
      section: 'Management',
      items: [
        { id: 'teachers', label: 'Teachers', icon: 'teachers', count: counts.teachers },
        { id: 'sections', label: 'Sections', icon: 'sections', count: counts.sections }
      ]
    },
    {
      section: 'Monitoring',
      items: [
        { id: 'attendance', label: 'Attendance', icon: 'attendance' },
        {
          id: 'interventions',
          label: 'Interventions',
          icon: 'interventions',
          count: counts.interventions,
          alert: true
        },
        { id: 'irip', label: 'IRIP Inbox', icon: 'irip', count: counts.irip }
      ]
    },
    {
      section: 'Communication',
      items: [{ id: 'announcements', label: 'Announcements', icon: 'announcements', count: counts.announcements }]
    },
    {
      section: 'Reports',
      items: [{ id: 'reports', label: 'Reports', icon: 'reports' }]
    }
  ];

  const sections = role === 'admin' ? adminItems : teacherItems;

  return (
    <aside className="sidebar">
      {sections.map((section) => (
        <div key={section.section} className="sidebar-group">
          <div className="sidebar-section">{section.section}</div>
          {section.items.map((item) => (
            <RenderNavItem
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </aside>
  );
}
