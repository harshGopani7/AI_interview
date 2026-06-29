import React, { useRef } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FaDownload, FaUpload, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

/**
 * CSVHandler Component
 * A reusable component for generating CSV templates and parsing uploaded CSV files
 * 
 * @param {Array} fields - Array of field objects with { name, label, required }
 * @param {Function} onDataParsed - Callback function to handle parsed data and missing fields
 * @param {String} templateName - Name for the downloaded CSV file
 */
const CSVHandler = ({ fields, onDataParsed, templateName = 'input-template' }) => {
  const fileInputRef = useRef(null);

  /**
   * Generate and download CSV template
   */
  const downloadCSVTemplate = () => {
    // Create CSV content with headers
    const headers = ['Field Label', 'Field Name', 'Required', 'Your Input'];
    const rows = fields.map(field => {
      let hint = '';
      
      // Add hints for specific field types
      if (field.name.includes('Date') || field.name.includes('date')) {
        hint = 'YYYY-MM-DD';
      } else if (field.name === 'considerationType') {
        hint = 'Cash/Non-Cash/Mixed';
      } else if (field.name === 'valuationMethodology') {
        hint = 'DCF/NAV/Comparable Companies/Market Multiples/Book Value';
      }
      
      return [
        field.label,
        field.name,
        field.required ? 'Yes' : 'No',
        hint // Placeholder hint for user
      ];
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${templateName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Parse uploaded CSV file
   */
  const parseCSVFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const parsedData = {};
      const filledFields = [];
      const missingFields = [];

      dataLines.forEach(line => {
        // Parse CSV line (handle quoted values)
        const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        if (matches && matches.length >= 4) {
          const fieldName = matches[1].replace(/"/g, '').trim();
          const userInput = matches[3].replace(/"/g, '').trim();
          
          // Store the value regardless of field type (dates, dropdowns, text - all work)
          if (userInput) {
            parsedData[fieldName] = userInput;
            filledFields.push(fieldName);
          }
        }
      });

      // Check for missing required fields
      fields.forEach(field => {
        if (field.required && !parsedData[field.name]) {
          missingFields.push(field.label);
        }
      });

      // Call the callback with parsed data and missing fields
      onDataParsed(parsedData, missingFields);
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }
      parseCSVFile(file);
    }
    // Reset input so the same file can be uploaded again
    e.target.value = '';
  };

  return (
    <div className="csv-handler-section mb-4">
      <Alert
        variant="info"
        style={{
          background: 'var(--icon-bg)',
          border: '1px solid var(--primary-color)',
          borderRadius: '12px',
        }}
      >
        <div className="d-flex align-items-start">
          <FaDownload size={24} className="text-primary me-3 mt-1" />
          <div className="flex-grow-1">
            <h6
              className="mb-2"
              style={{
                color: 'var(--primary-color)',
                fontWeight: '600',
              }}
            >
              <FaDownload /> CSV Input Method (Recommended)
            </h6>
            <p
              className="mb-3"
              style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}
            >
              <span style={{ color: 'red', fontWeight: 'bold' }}>All fields are required.</span>
              {' '}Download the CSV template, fill in all required details, and upload it back to auto-populate the form.
            </p>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <Button
                variant="primary"
                size="sm"
                onClick={downloadCSVTemplate}
                style={{
                  borderRadius: '8px',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                }}
              >
                <FaDownload className="me-2" />
                Download CSV Template
              </Button>
              
              <Button
                variant="success"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  borderRadius: '8px',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                }}
              >
                <FaUpload className="me-2" />
                Upload Filled CSV
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
};

/**
 * MissingFieldsAlert Component
 * Display missing required fields after CSV upload with clickable navigation
 */
export const MissingFieldsAlert = ({ missingFields, fieldNameMap, onClose }) => {
  if (!missingFields || missingFields.length === 0) return null;

  const scrollToField = (fieldLabel) => {
    // Try to find the field by name attribute
    const fieldName = fieldNameMap?.[fieldLabel];
    if (fieldName) {
      const element = document.querySelector(`[name="${fieldName}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        // Add a brief highlight effect
        element.style.transition = 'box-shadow 0.3s';
        element.style.boxShadow = '0 0 10px 2px rgba(255, 193, 7, 0.8)';
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 2000);
      }
    }
  };

  return (
    <Alert variant="warning" dismissible onClose={onClose} className="mb-4">
      <div className="d-flex align-items-start">
        <FaExclamationTriangle size={24} className="text-warning me-3 mt-1" />
        <div className="flex-grow-1">
          <h6 className="mb-2" style={{ fontWeight: '600' }}>
            <FaExclamationTriangle /> Missing Required Fields
          </h6>
          <p className="mb-2">
            The following <span style={{ color: 'red', fontWeight: 'bold' }}>required fields</span> are missing from your CSV upload.
            <br />
            <strong>Click on any field below to jump directly to it:</strong>
          </p>
          <ul className="mb-0" style={{ listStyle: 'none', paddingLeft: 0 }}>
            {missingFields.map((field, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => scrollToField(field)}
                  style={{
                    color: '#dc3545',
                    fontWeight: '600',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    border: '1px solid #dc3545',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                    e.target.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#dc3545';
                  }}
                >
                  {field}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Alert>
  );
};

/**
 * SuccessUploadAlert Component
 * Display success message after CSV upload with review reminder
 */
export const SuccessUploadAlert = ({ onClose }) => {
  return (
    <Alert variant="success" dismissible onClose={onClose} className="mb-4">
      <div className="d-flex align-items-start">
        <FaCheckCircle size={24} className="text-success me-3 mt-1" />
        <div className="flex-grow-1">
          <h6 className="mb-2" style={{ fontWeight: '600', color: '#198754' }}>
            <FaCheckCircle /> CSV Data Uploaded Successfully!
          </h6>
          <p className="mb-0" style={{ fontSize: '14px' }}>
            Your data has been imported. <strong>Please scroll down and review all the fields</strong> to ensure accuracy before generating the report.
          </p>
        </div>
      </div>
    </Alert>
  );
};

export default CSVHandler;
