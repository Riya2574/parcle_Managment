import React, { useState } from 'react'

const ParcelsPage = ({ partyOptions = [], initialPartyName = '', onSaveParcel, searchResults = [], searchQuery = '' }) => {
  const [formData, setFormData] = useState({
    party: initialPartyName || '',
    customerName: '',
    number: '',
    product: '',
    sendDate: '',
    receivedStatus: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!formData.party) nextErrors.party = 'Party is required.'
    if (formData.customerName.trim().length < 2) nextErrors.customerName = 'Customer name is required.'
    if (formData.number.trim().length < 5) nextErrors.number = 'Phone number is required.'
    if (!formData.product.trim()) nextErrors.product = 'Product is required.'
    if (!formData.receivedStatus) nextErrors.receivedStatus = 'Status is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (onSaveParcel) {
      onSaveParcel(formData)
    } else {
      alert(`Parcel added for ${formData.party || 'selected party'}`)
    }
  }

  const handleReset = () => {
    setFormData({
      party: initialPartyName || '',
      customerName: '',
      number: '',
      product: '',
      sendDate: '',
      receivedStatus: ''
    })
  }

  return (
    <section className="parties-page">
      <div className="page-header">
        <div>
          <p className="overline">Parcel Management</p>
          <h1>Add New Parcel</h1>
          <p className="page-subtitle">Fill in the parcel details below to register a new shipment.</p>
        </div>
      </div>

      <div className="card form-card">
        <div className="section-header">
          <div>
            <h2>Parcel Information</h2>
            <p className="section-copy">Capture the sender, recipient, and delivery details.</p>
          </div>
        </div>

        <form className="parcel-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>Party</span>
              <select required name="party" value={formData.party} onChange={handleChange}>
                <option value="">Select party</option>
                {partyOptions.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
              {errors.party && <small className="field-error">{errors.party}</small>}
            </label>
            <label>
              <span>Customer Name</span>
              <input required minLength="2" type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Enter customer name" />
              {errors.customerName && <small className="field-error">{errors.customerName}</small>}
            </label>
            <label>
              <span>Number</span>
              <input required minLength="5" type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Enter phone number" />
              {errors.number && <small className="field-error">{errors.number}</small>}
            </label>
            <label>
              <span>Product</span>
              <input required type="text" name="product" value={formData.product} onChange={handleChange} placeholder="Enter product name" />
              {errors.product && <small className="field-error">{errors.product}</small>}
            </label>
            <label>
              <span>Send Date</span>
              <input type="date" name="sendDate" value={formData.sendDate} onChange={handleChange} />
            </label>
            <label>
              <span>Received Status</span>
              <select required name="receivedStatus" value={formData.receivedStatus} onChange={handleChange}>
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </select>
              {errors.receivedStatus && <small className="field-error">{errors.receivedStatus}</small>}
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={handleReset}>Reset</button>
            <button type="submit" className="primary-button">Save Parcel</button>
          </div>
        </form>
      </div>

      {searchQuery && (
        <div className="card report-card">
          <div className="section-header">
            <div>
              <h2>Search Results</h2>
              <p className="section-copy">Parcels matching "{searchQuery}".</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SR No.</th><th>Customer</th><th>Phone</th><th>Product</th><th>Party</th><th>Status</th></tr></thead>
              <tbody>
                {searchResults.length === 0 ? <tr><td colSpan="6">No matching parcels found.</td></tr> : searchResults.map((parcel) => (
                  <tr key={parcel.id}>
                    <td>{parcel.id}</td><td>{parcel.customerName}</td><td>{parcel.phone}</td><td>{parcel.product}</td><td>{parcel.partyName}</td><td>{parcel.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default ParcelsPage
