import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Save, Calculator, Building2, Printer, Mail, MessageCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import * as api from '../api';

function NewInvoice() {
  const [formData, setFormData] = useState({
    shopName: '',
    invoiceNumber: '',
    orderNumber: '',
    invoiceDate: '',
    terms: '',
    dueDate: '',
    salesManager: '',
    distributor: '',
    customerNotes: ''
  });

  const [isSaved, setIsSaved] = useState(false);

  const [ownerProfile, setOwnerProfile] = useState(() => {
    const saved = localStorage.getItem('inventoryOwnerProfile');
    return saved ? JSON.parse(saved) : { name: "Alice Johnson" };
  });

  const [lineItems, setLineItems] = useState([
    { id: 1, description: '', quantity: 1, price: 0, amount: 0 }
  ]);

  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.getItems();
        setInventoryItems(response.data);
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      }
    };
    fetchItems();
  }, []);

  const distributors = [
    'Distributor A',
    'Distributor B',
    'Distributor C',
    'Premium Grocery Dist.'
  ];

  const availableShops = [
    "City Center Mart",
    "Green Valley Organics",
    "Corner Convenience",
    "Wholesale Club Direct"
  ];

  const salesManagers = [
    ownerProfile.name,
    "John Doe",
    "Jane Smith",
    "Robert Johnson",
    "Emily Davis"
  ];

  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'shopName') {
      setShowSuggestions(true);
    }
  };

  const handleShopSelect = (shop) => {
    setFormData({ ...formData, shopName: shop });
    setShowSuggestions(false);
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index][field] = value;
    
    // Auto-fill price if description is selected from inventory
    if (field === 'description') {
      const selectedItem = inventoryItems.find(item => item.name === value);
      if (selectedItem) {
        updatedItems[index]['price'] = selectedItem.price;
      }
    }
    
    if (field === 'quantity' || field === 'price' || field === 'description') {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const price = parseFloat(updatedItems[index].price) || 0;
      updatedItems[index].amount = qty * price;
    }
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), description: '', quantity: 1, price: 0, amount: 0 }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const updatedItems = lineItems.filter((_, i) => i !== index);
      setLineItems(updatedItems);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => window.print(), 300); // Automatically prompt print after render
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Invoice ${formData.invoiceNumber} from ${ownerProfile.name}`);
    const body = encodeURIComponent(`Hello ${formData.shopName},\n\nPlease find attached the details for Invoice ${formData.invoiceNumber} for the amount of ₹${calculateTotal().toFixed(2)}.\n\nThank you for your business!\n\nBest,\n${ownerProfile.name}`);
    const shopEmail = `owner@${formData.shopName.replace(/\s+/g, '').toLowerCase() || 'shop'}.com`;
    window.location.href = `mailto:${shopEmail}?subject=${subject}&body=${body}`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hello ${formData.shopName}, this is ${ownerProfile.name}. Here is the summary for your new Invoice ${formData.invoiceNumber}. Total amount due is ₹${calculateTotal().toFixed(2)}. Please let us know if you have any questions!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isSaved) {
    return (
      <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .app-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
            .glass-panel { box-shadow: none !important; border: none !important; padding: 0 !important; }
            header, nav, .navbar { display: none !important; }
          }
        `}</style>
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', color: '#000' }}>
          
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsSaved(false)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
              <ArrowLeft size={18} /> Edit Invoice
            </button>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handlePrint} style={{ background: '#475569', boxShadow: 'none' }}>
                <Printer size={18} /> Print
              </button>
              <button className="btn btn-primary" onClick={handleEmail} style={{ background: '#3b82f6', boxShadow: 'none' }}>
                <Mail size={18} /> Email
              </button>
              <button className="btn btn-primary" onClick={handleWhatsApp} style={{ background: '#25D366', boxShadow: 'none' }}>
                <MessageCircle size={18} /> WhatsApp
              </button>
            </div>
          </div>

          <div style={{ padding: '1rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', color: '#0f172a', margin: 0, padding: 0, fontFamily: 'serif', letterSpacing: '1px' }}>INVOICE</h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: '1.1rem' }}>#{formData.invoiceNumber || 'DRAFT'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>{ownerProfile.company || ownerProfile.name}</h3>
                <p style={{ margin: 0, color: '#64748b' }}>{ownerProfile.name}</p>
                <p style={{ margin: 0, color: '#64748b' }}>{ownerProfile.email}</p>
                <p style={{ margin: 0, color: '#64748b' }}>{ownerProfile.phone}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div>
                <h4 style={{ color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.85rem' }}>Billed To:</h4>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>{formData.shopName || 'Walk-in Customer'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 0.25rem 0' }}><strong style={{ color: '#475569' }}>Date:</strong> {formData.invoiceDate || new Date().toISOString().split('T')[0]}</p>
                {formData.dueDate && <p style={{ margin: '0 0 0.25rem 0' }}><strong style={{ color: '#475569' }}>Due Date:</strong> {formData.dueDate}</p>}
                {formData.terms && <p style={{ margin: '0 0 0.25rem 0' }}><strong style={{ color: '#475569' }}>Terms:</strong> {formData.terms}</p>}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0', color: '#0f172a', backgroundColor: 'transparent' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem 0', color: '#0f172a', backgroundColor: 'transparent' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 0', color: '#0f172a', backgroundColor: 'transparent' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 0', color: '#0f172a', backgroundColor: 'transparent' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 0', color: '#334155' }}>{item.description || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '1rem 0', color: '#334155' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '1rem 0', color: '#334155' }}>₹{item.price}</td>
                    <td style={{ textAlign: 'right', padding: '1rem 0', color: '#334155', fontWeight: 'bold' }}>₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span style={{ color: '#0f172a' }}>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                  <span>Total Due</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {formData.customerNotes && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#64748b', margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase' }}>Notes:</h4>
                <p style={{ margin: 0, color: '#334155' }}>{formData.customerNotes}</p>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              Thank you for your business!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <FileText size={24} className="text-primary-color" />
            Create New Invoice
          </h2>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
            Total: ₹{calculateTotal().toFixed(2)}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Header Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Shop Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  name="shopName"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.shopName}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. City Supermarket"
                  required
                />
              </div>
              {showSuggestions && formData.shopName.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  marginTop: '0.25rem',
                  boxShadow: 'var(--glass-shadow)',
                  zIndex: 50,
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {availableShops
                    .filter(s => s.toLowerCase().includes(formData.shopName.toLowerCase()))
                    .map((shop, i, arr) => (
                    <div 
                      key={i} 
                      onClick={() => handleShopSelect(shop)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {shop}
                    </div>
                  ))}
                  {availableShops.filter(s => s.toLowerCase().includes(formData.shopName.toLowerCase())).length === 0 && (
                    <div style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      No matching shops found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                name="invoiceNumber"
                className="form-control"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="INV-0001"
                required
              />
            </div>

            <div className="form-group">
              <label>Order Number</label>
              <input
                type="text"
                name="orderNumber"
                className="form-control"
                value={formData.orderNumber}
                onChange={handleInputChange}
                placeholder="ORD-0001"
              />
            </div>

            <div className="form-group">
              <label>Sales Manager</label>
              <select
                name="salesManager"
                className="form-control"
                value={formData.salesManager}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Sales Manager</option>
                {salesManagers.map(manager => (
                  <option key={manager} value={manager}>{manager}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Distributor Selection</label>
              <select
                name="distributor"
                className="form-control"
                value={formData.distributor}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Distributor</option>
                {distributors.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Terms</label>
              <select
                name="terms"
                className="form-control"
                value={formData.terms}
                onChange={handleInputChange}
              >
                <option value="">Select Terms</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>

            <div className="form-group">
              <label>Invoice Date</label>
              <input
                type="date"
                name="invoiceDate"
                className="form-control"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '2rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem', color: '#e2e8f0' }}>
              <Calculator size={18} className="text-accent-color" />
              Line Items
            </h3>
            
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', width: '40%' }}>Description</th>
                    <th style={{ padding: '0.75rem', width: '15%' }}>Quantity</th>
                    <th style={{ padding: '0.75rem', width: '20%' }}>Price (₹)</th>
                    <th style={{ padding: '0.75rem', width: '20%' }}>Amount (₹)</th>
                    <th style={{ padding: '0.75rem', width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id}>
                      <td style={{ padding: '0.5rem' }}>
                        <select
                          className="form-control"
                          style={{ margin: 0 }}
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          required
                        >
                          <option value="">Select Inventory Item</option>
                          {inventoryItems.map(invItem => (
                            <option key={invItem.id} value={invItem.name}>
                              {invItem.name} (₹{invItem.price})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ margin: 0 }}
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          style={{ margin: 0 }}
                          value={item.price}
                          onChange={(e) => handleLineItemChange(index, 'price', e.target.value)}
                          min="0"
                          required
                        />
                      </td>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: '#ef4444' }}
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={addLineItem}
            >
              <Plus size={18} /> Add Line Item
            </button>
          </div>

          {/* Footer Details */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Customer Notes</label>
            <textarea
              name="customerNotes"
              className="form-control"
              value={formData.customerNotes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Thanks for your business..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Save Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewInvoice;
