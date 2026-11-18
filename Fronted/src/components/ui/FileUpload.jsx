import { useRef } from "react";
import Button from "./Button";

const FileUpload = ({
  id = "resume",
  label = "Resume",
  statusText = "Optional",
  helperText,
  error,
  file,
  onFileSelect,
  onFileRemove,
  accept = ".pdf",
  disabled = false,
  className = "",
  hideHeader = false,
}) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && onFileSelect) {
      onFileSelect(selected);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className={`file-upload ${className}`}>
      {!hideHeader && (label || statusText) && (
        <div className="form-field__header">
          {label && <label className="form-field__label">{label}</label>}
          {statusText && (
            <span className="form-field__status">{statusText}</span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        hidden
      />

      {!file ? (
        <label
          htmlFor={id}
          className="file-upload__dropzone"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && inputRef.current) {
              e.preventDefault();
              inputRef.current.click();
            }
          }}
        >
          <span className="file-upload__title">Click to upload your resume</span>
          <div className="file-upload__cloud-icon-wrap" aria-hidden="true">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6495ED"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <span className="file-upload__subtext">PDF only, maximum 3 MB</span>
        </label>
      ) : (
        <div className="file-upload__selected">
          <div className="file-upload__info">
            <span className="file-upload__name">{file.name}</span>
            <span className="file-upload__size">{formatSize(file.size)}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove uploaded resume"
          >
            Remove
          </Button>
        </div>
      )}

      {error ? (
        <p className="form-field__error-text" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="form-field__helper">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FileUpload;
