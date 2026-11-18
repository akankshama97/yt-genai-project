import React, { useRef } from "react";
import Button from "./Button";

const FileUpload = ({
  id = "resume",
  label = "2. Resume",
  statusText = "Optional",
  helperText = "Upload your resume so questions and analysis match your actual background.",
  error,
  file,
  onFileSelect,
  onFileRemove,
  accept = ".pdf",
  disabled = false,
  className = "",
}) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && onFileSelect) {
      onFileSelect(selected);
    }
  };

  const handleRemove = () => {
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
      {(label || statusText) && (
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
