import React, { useState, useEffect } from "react";
import "../Styles/form.css";
import { useNavigate, useLocation } from "react-router-dom";

function PackageForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const packageToEdit = location.state?.packageToEdit || null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    if (packageToEdit) {
      setName(packageToEdit.name || '');
      setPrice(packageToEdit.price || '');
    }
  }, [packageToEdit]);

  const handlePackage = () => {
    setNameError('');
    setPriceError('');

    let valid = true;

    if (!name.trim()) {
      setNameError('Package name is required');
      valid = false;
    }

    if (!price) {
      setPriceError('Price is required');
      valid = false;
    }

    if (!valid) return;

    // Frontend-only success message
    if (packageToEdit) {
      alert("Package updated successfully (Frontend only)");
    } else {
      alert("Package added successfully (Frontend only)");
    }

    navigate('/admin/manage-package');
  };

  return (
    <div className="asacomp">
      <h3>{packageToEdit ? 'Edit Package' : 'Add Package'}</h3>

      <div className="inasacomp">
        <h4>Enter Basic Details</h4>

        <div className="form">
          <input
            type="text"
            value={name}
            placeholder="Enter Package Name*"
            onChange={(e) => setName(e.target.value)}
          />
          {nameError && <p className="error">{nameError}</p>}

          <input
            type="number"
            value={price}
            placeholder="Enter Price (Per Paragraph)*"
            onChange={(e) => setPrice(e.target.value)}
          />
          {priceError && <p className="error">{priceError}</p>}
        </div>

        <div className="bttns">
          <button
            className="cancel"
            onClick={() => navigate('/admin/manage-package')}
          >
            Cancel
          </button>

          <button className="submit" onClick={handlePackage}>
            {packageToEdit ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PackageForm;
