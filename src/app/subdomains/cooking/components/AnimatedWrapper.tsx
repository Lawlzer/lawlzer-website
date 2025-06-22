'use client';

import React from 'react';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'fadeSlideIn';
  delay?: number;
  className?: string;
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
}) => {
  const getAnimationClass = () => {
    switch (animation) {
      case 'fadeIn':
        return 'animate-fade-in';
      case 'slideIn':
        return 'animate-fade-in-up';
      case 'scaleIn':
        return 'animate-scale-in';
      case 'fadeSlideIn':
        return 'animate-fade-in-down';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div
      className={`${getAnimationClass()} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// List item animation wrapper
interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {React.Children.map(children, (child, index) => (
        <AnimatedWrapper animation="fadeSlideIn" delay={index * 50}>
          {child}
        </AnimatedWrapper>
      ))}
    </div>
  );
};

// Page transition wrapper
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AnimatedWrapper animation="fadeIn" className="w-full">
      {children}
    </AnimatedWrapper>
  );
};
