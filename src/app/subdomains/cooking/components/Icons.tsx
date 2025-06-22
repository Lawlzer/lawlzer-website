'use client';

import React from 'react';

// Base icon props interface
export interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: number;
  className?: string;
}

// Icon wrapper component for consistent behavior
const Icon: React.FC<IconProps> = ({
  size = 20,
  className = '',
  children,
  ...props
}) => {
  const sizeClass = `w-${size / 4} h-${size / 4}`;
  const combinedClassName = className || sizeClass;

  return (
    <svg
      className={combinedClassName}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
};

// Individual icon components
export const HomeIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </Icon>
);

export const CameraIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </Icon>
);

export const UtensilsIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 5l1 1v5l-1 1m0 0v9m0-9h-4m4 0h4m-8-6v5l1 1m0 0v9m0-9H6m4-6L9 5"
    />
  </Icon>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </Icon>
);

export const GoalIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </Icon>
);

export const ChefHatIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3C9.8 3 8 4.8 8 7c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5V21h12v-6.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4 0-2.2-1.8-4-4-4z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 21v-3m6 3v-3m-3 3v-3"
    />
  </Icon>
);

export const TimeIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </Icon>
);

export const UserIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </Icon>
);

export const CaloriesIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </Icon>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </Icon>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </Icon>
);

export const ExportIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </Icon>
);

export const AnalysisIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </Icon>
);

export const PieChartIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
    />
  </Icon>
);

export const ThumbsUpIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
    />
  </Icon>
);

export const ThumbsDownIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
    />
  </Icon>
);

export const FlagIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
    />
  </Icon>
);

export const LeafIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c0-3.5-1.5-6.5-4-8.5M12 21a9 9 0 01-9-9m9 9c0-3.5 1.5-6.5 4-8.5M3 12a9 9 0 019-9m-9 9c0 3.5 1.5 6.5 4 8.5M12 3c-3.5 0-6.5 1.5-8.5 4"
    />
  </Icon>
);

export const ClipboardIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </Icon>
);

export const ToolIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.121 15.879c1.17-1.17 1.17-3.07 0-4.242-1.17-1.17-3.07-1.17-4.242 0l-5.36 5.36a3 3 0 004.241 4.24l5.36-5.358zm0 0L20.5 9.5a2.828 2.828 0 10-4-4l-6.379 6.379m0 0a3 3 0 104.243 4.242"
    />
  </Icon>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </Icon>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </Icon>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </Icon>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </Icon>
);

export const MinusIcon: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </Icon>
);

export const SpinnerIcon: React.FC<IconProps & { spinning?: boolean }> = ({
  spinning = true,
  className,
  ...props
}) => (
  <Icon
    className={`${className ?? ''} ${spinning ? 'animate-spin' : ''}`}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      fill="currentColor"
      stroke="none"
    />
  </Icon>
);

// Icon registry for dynamic icon selection
export const iconRegistry = {
  home: HomeIcon,
  camera: CameraIcon,
  utensils: UtensilsIcon,
  calendar: CalendarIcon,
  goal: GoalIcon,
  chefHat: ChefHatIcon,
  time: TimeIcon,
  user: UserIcon,
  calories: CaloriesIcon,
  chevronDown: ChevronDownIcon,
  trash: TrashIcon,
  export: ExportIcon,
  analysis: AnalysisIcon,
  pieChart: PieChartIcon,
  thumbsUp: ThumbsUpIcon,
  thumbsDown: ThumbsDownIcon,
  flag: FlagIcon,
  leaf: LeafIcon,
  clipboard: ClipboardIcon,
  tool: ToolIcon,
  search: SearchIcon,
  check: CheckIcon,
  x: XIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  spinner: SpinnerIcon,
} as const;

export type IconName = keyof typeof iconRegistry;

// Dynamic icon component
export const DynamicIcon: React.FC<{ name: IconName } & IconProps> = ({
  name,
  ...props
}) => {
  const IconComponent = iconRegistry[name];
  return <IconComponent {...props} />;
};
