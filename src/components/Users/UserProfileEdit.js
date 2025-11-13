import React, { useState } from 'react';
import { useFormik } from 'formik';

export default function UserProfileEdit({ user = {}, onClose = () => {}, onSave = () => {} }) {
  const [isEditing, setIsEditing] = useState(false);
  const initialValues = {
    address: user.address || user.Address || '',
    city: user.city || user.City || '',
    state: user.state || user.State || '',
    zipCode: user.zipCode || user.ZipCode || user.zip || '',
    country: user.country || user.Country || '',
    dob: user.dob || user.DOB || '',
    anniversary: user.anniversary || user.Anniversary || '',
    gender: user.gender || user.Gender || '',
  };

  const formik = useFormik({
    initialValues,
    validate: (values) => {
      const errors = {};
      // zip code: optional but if present must be 4-10 digits
      if (values.zipCode && !/^\d{4,10}$/.test(values.zipCode)) {
        errors.zipCode = 'Zip code must be 4-10 digits';
      }
      // dob must be in the past
      if (values.dob) {
        const dob = new Date(values.dob);
        const today = new Date();
        if (isNaN(dob.getTime())) {
          errors.dob = 'Invalid date of birth';
        } else if (dob > today) {
          errors.dob = 'Date of birth must be in the past';
        }
      }
      // anniversary must be after dob if both provided
      if (values.anniversary) {
        const ann = new Date(values.anniversary);
        if (isNaN(ann.getTime())) {
          errors.anniversary = 'Invalid anniversary date';
        } else if (values.dob) {
          const dob = new Date(values.dob);
          if (!isNaN(dob.getTime()) && ann < dob) {
            errors.anniversary = 'Anniversary cannot be before date of birth';
          }
        }
      }
      // gender allowed values
      if (values.gender && !['Male', 'Female', 'Other', ''].includes(values.gender)) {
        errors.gender = 'Invalid selection';
      }
      return errors;
    },
    onSubmit: (values) => {
      const updated = { ...user, ...values };
      try {
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updated }));
      } catch (err) {
        console.error('Failed to save profile', err);
      }
      onSave(updated);
      onClose();
    },
  });

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{
        zIndex: 2000,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop placed before dialog so it stays behind the modal */}
      <div
        className="modal-backdrop fade show"
        style={{
          zIndex: 1990,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.45)'
        }}
      />

      <div className="modal-dialog modal-dialog-centered" role="document" style={{ zIndex: 2001, position: 'relative' }}>
        <div className="modal-content">
           <form onSubmit={formik.handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? 'Edit Profile' : 'View Profile'}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input name="address" value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.address && formik.errors.address ? 'is-invalid' : ''}`} disabled={!isEditing} />
                  {formik.touched.address && formik.errors.address && <div className="invalid-feedback">{formik.errors.address}</div>}
                </div>
                <div className="row">
                  <div className="mb-3 col-md-6">
                    <label className="form-label">City</label>
                    <input name="city" value={formik.values.city} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.city && formik.errors.city ? 'is-invalid' : ''}`} disabled={!isEditing} />
                    {formik.touched.city && formik.errors.city && <div className="invalid-feedback">{formik.errors.city}</div>}
                  </div>
                  <div className="mb-3 col-md-6">
                    <label className="form-label">State</label>
                    <input name="state" value={formik.values.state} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.state && formik.errors.state ? 'is-invalid' : ''}`} disabled={!isEditing} />
                    {formik.touched.state && formik.errors.state && <div className="invalid-feedback">{formik.errors.state}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="mb-3 col-md-6">
                    <label className="form-label">Zip Code</label>
                    <input name="zipCode" value={formik.values.zipCode} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.zipCode && formik.errors.zipCode ? 'is-invalid' : ''}`} disabled={!isEditing} />
                    {formik.touched.zipCode && formik.errors.zipCode && <div className="invalid-feedback">{formik.errors.zipCode}</div>}
                  </div>
                  <div className="mb-3 col-md-6">
                    <label className="form-label">Country</label>
                    <input name="country" value={formik.values.country} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.country && formik.errors.country ? 'is-invalid' : ''}`} disabled={!isEditing} />
                    {formik.touched.country && formik.errors.country && <div className="invalid-feedback">{formik.errors.country}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="mb-3 col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input name="dob" type="date" value={formik.values.dob} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.dob && formik.errors.dob ? 'is-invalid' : ''}`} disabled={!isEditing} />
                    {formik.touched.dob && formik.errors.dob && <div className="invalid-feedback">{formik.errors.dob}</div>}
                  </div>
                  <div className="mb-3 col-md-6">
                    <label className="form-label">Anniversary</label>
                    <input name="anniversary" type="date" value={formik.values.anniversary} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-control ${formik.touched.anniversary && formik.errors.anniversary ? 'is-invalid' : ''}`} disabled={!isEditing} />
                    {formik.touched.anniversary && formik.errors.anniversary && <div className="invalid-feedback">{formik.errors.anniversary}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <select name="gender" value={formik.values.gender} onChange={formik.handleChange} onBlur={formik.handleBlur} className={`form-select ${formik.touched.gender && formik.errors.gender ? 'is-invalid' : ''}`} disabled={!isEditing}>
                   <option value="">Prefer not to say</option>
                   <option value="Male">Male</option>
                   <option value="Female">Female</option>
                   <option value="Other">Other</option>
                 </select>
                 {formik.touched.gender && formik.errors.gender && <div className="invalid-feedback">{formik.errors.gender}</div>}
               </div>
             </div>
            <div className="modal-footer">
              {!isEditing ? (
                <>
                  <button type="button" className="btn btn-outline-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => { formik.resetForm(); setIsEditing(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </>
              )}
            </div>
           </form>
         </div>
       </div>
     </div>
   );
 }
