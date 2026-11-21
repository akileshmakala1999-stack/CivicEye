import React, { createContext, useContext, useState, useEffect } from 'react';
import { CivicIssue, UserProfile } from '../types';
import { DEMO_RECENT_ISSUES, DEMO_HERO_ISSUES } from '../data/mockData';

interface CivicContextType {
  issues: CivicIssue[];
  currentUser: UserProfile;
  selectedIssue: CivicIssue | null;
  setSelectedIssue: (issue: CivicIssue | null) => void;
  addIssue: (issue: Partial<CivicIssue>) => CivicIssue;
  toggleConfirmIssue: (issueId: string) => void;
  verifyResolution: (issueId: string) => void;
  switchUserRole: (role: 'citizen' | 'authority') => void;
  stats: {
    reported: number;
    resolved: number;
    active: number;
    contributions: number;
  };
}

const defaultCitizen: UserProfile = {
  id: 'usr-aditya',
  name: 'Aditya (Citizen Guardian)',
  role: 'citizen',
  title: 'Community Watch Level 3',
  trustScore: 840,
  ward: 'Ward 4 - Metro Central',
  reportsSubmitted: 6,
  confirmationsGiven: 42,
  verificationsCompleted: 14,
};

const defaultAuthority: UserProfile = {
  id: 'usr-rajesh',
  name: 'Eng. Rajesh Kumar',
  role: 'authority',
  title: 'Senior Executive Engineer',
  department: 'Municipal Public Works (Roads Division)',
  trustScore: 990,
  ward: 'District 04 Headquarters',
  reportsSubmitted: 18,
  confirmationsGiven: 120,
  verificationsCompleted: 78,
};

const initialMergedIssues: CivicIssue[] = [
  ...DEMO_HERO_ISSUES.map(issue => ({
    ...issue,
    peopleImpactScore: issue.severity === 'critical' ? 92 : issue.severity === 'high' ? 76 : 54,
    hasUserConfirmed: false,
    assignedOfficer: 'Officer M. Sharma, PWD',
  })),
  ...DEMO_RECENT_ISSUES.filter(r => !DEMO_HERO_ISSUES.some(h => h.id === r.id)).map(issue => ({
    ...issue,
    peopleImpactScore: issue.severity === 'critical' ? 88 : issue.severity === 'high' ? 72 : 48,
    hasUserConfirmed: false,
    assignedOfficer: 'Superintendent V. Patil',
  })),
];

const CivicContext = createContext<CivicContextType | undefined>(undefined);

export const CivicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [issues, setIssues] = useState<CivicIssue[]>(() => {
    const saved = localStorage.getItem('civiceye_issues');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialMergedIssues;
      }
    }
    return initialMergedIssues;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedRole = localStorage.getItem('civiceye_role');
    return savedRole === 'authority' ? defaultAuthority : defaultCitizen;
  });

  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  useEffect(() => {
    localStorage.setItem('civiceye_issues', JSON.stringify(issues));
  }, [issues]);

  const switchUserRole = (role: 'citizen' | 'authority') => {
    const user = role === 'authority' ? defaultAuthority : defaultCitizen;
    setCurrentUser(user);
    localStorage.setItem('civiceye_role', role);
  };

  const addIssue = (newIssueData: Partial<CivicIssue>): CivicIssue => {
    const createdIssue: CivicIssue = {
      id: `CE-${Date.now().toString().slice(-4)}`,
      title: newIssueData.title || 'Untitled Civic Incident',
      category: newIssueData.category || 'Road damage',
      location: newIssueData.location || 'Sector 04 Central',
      coordinates: newIssueData.coordinates || {
        lat: 12.9716,
        lng: 77.5946,
        mapXPercent: 48 + Math.floor(Math.random() * 20 - 10),
        mapYPercent: 52 + Math.floor(Math.random() * 20 - 10),
      },
      status: 'reported',
      severity: newIssueData.severity || 'high',
      peopleImpactScore: newIssueData.peopleImpactScore || 85,
      reportedTime: 'Just now',
      confirmationsCount: 1,
      hasUserConfirmed: true,
      description: newIssueData.description || 'Observed hazardous condition requiring civic attention.',
      departmentAssigned: newIssueData.departmentAssigned || 'Triage Bureau',
      assignedOfficer: 'Pending Dispatch',
      imageUrl: newIssueData.imageUrl,
      reportedBy: currentUser.name,
    };

    setIssues(prev => [createdIssue, ...prev]);
    setCurrentUser(prev => ({
      ...prev,
      reportsSubmitted: prev.reportsSubmitted + 1,
      trustScore: Math.min(1000, prev.trustScore + 15),
    }));

    return createdIssue;
  };

  const toggleConfirmIssue = (issueId: string) => {
    setIssues(prev =>
      prev.map(issue => {
        if (issue.id === issueId) {
          const isConfirmed = !!issue.hasUserConfirmed;
          return {
            ...issue,
            hasUserConfirmed: !isConfirmed,
            confirmationsCount: isConfirmed
              ? Math.max(0, issue.confirmationsCount - 1)
              : issue.confirmationsCount + 1,
          };
        }
        return issue;
      })
    );

    setCurrentUser(prev => ({
      ...prev,
      confirmationsGiven: prev.confirmationsGiven + 1,
      trustScore: Math.min(1000, prev.trustScore + 5),
    }));
  };

  const verifyResolution = (issueId: string) => {
    setIssues(prev =>
      prev.map(issue => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status: 'verified',
            resolvedTime: 'Verified by Citizen Consensus',
          };
        }
        return issue;
      })
    );

    setCurrentUser(prev => ({
      ...prev,
      verificationsCompleted: prev.verificationsCompleted + 1,
      trustScore: Math.min(1000, prev.trustScore + 20),
    }));
  };

  const stats = {
    reported: 1482 + issues.length - initialMergedIssues.length,
    resolved: 1128 + issues.filter(i => i.status === 'resolved' || i.status === 'verified').length - initialMergedIssues.filter(i => i.status === 'resolved' || i.status === 'verified').length,
    active: issues.filter(i => i.status !== 'resolved' && i.status !== 'verified').length,
    contributions: 4890 + currentUser.confirmationsGiven + currentUser.reportsSubmitted,
  };

  return (
    <CivicContext.Provider
      value={{
        issues,
        currentUser,
        selectedIssue,
        setSelectedIssue,
        addIssue,
        toggleConfirmIssue,
        verifyResolution,
        switchUserRole,
        stats,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};

