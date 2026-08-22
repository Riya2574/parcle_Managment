import React, { useState } from 'react'

const ParcelsPage = ({ partyOptions = [], initialPartyName = '', onSaveParcel }) => {
  const [formData, setFormData] = useState({
    party: initialPartyName || '',
    customerName: '',
    number: '',
    product: '',
    sendDate: '',
    receivedStatus: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
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
              <select name="party" value={formData.party} onChange={handleChange}>
                <option value="">Select party</option>
                {partyOptions.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Customer Name</span>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Enter customer name" />
            </label>
            <label>
              <span>Number</span>
              <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Enter phone number" />
            </label>
            <label>
              <span>Product</span>
              <input type="text" name="product" value={formData.product} onChange={handleChange} placeholder="Enter product name" />
            </label>
            <label>
              <span>Send Date</span>
              <input type="date" name="sendDate" value={formData.sendDate} onChange={handleChange} />
            </label>
            <label>
              <span>Received Status</span>
              <select name="receivedStatus" value={formData.receivedStatus} onChange={handleChange}>
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={handleReset}>Reset</button>
            <button type="submit" className="primary-button">Save Parcel</button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default ParcelsPage
