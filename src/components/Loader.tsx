import React from "react";

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  fullScreen = true,
  message = "Chargement en cours..."
}) => {
  return (
    <div className={fullScreen ? "foodi-page-loader" : "foodi-inline-loader"}>
      <div className="foodi-loader-spinner-box">
        <div className="foodi-loader-spinner" />
        <img
          src="/images/logo.png"
          alt="Foodi"
          className="foodi-loader-logo"
        />
      </div>

      {message && <p className="foodi-loader-text">{message}</p>}
    </div>
  );
};
