const fs = require('fs');
let c = fs.readFileSync('src/components/catalog/ListBookForm.tsx', 'utf8');
c = c.replace(
  '<div className="mb-8">\r\n              <label className="block text-xs font-bold text-[#1d1d1f] mb-3">Listing Type',
  `<div className="mb-8">
              <label className="block text-xs font-bold text-[#1d1d1f] mb-3">Delivery Method <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {['SHIPPING', 'MEETUP', 'BOTH'].map(type => (
                  <div 
                    key={type}
                    onClick={() => setFormData(prev => ({...prev, deliveryType: type}))}
                    className={\`cursor-pointer rounded-xl p-3 border-2 flex items-start gap-2 transition-colors \${formData.deliveryType === type ? 'bg-[#FFF8F0] border-[#C84200] shadow-sm' : 'bg-white border-[#1d1d1f]/10 hover:border-[#C84200]/30'}\`}
                  >
                    <div className={\`mt-0.5 rounded-full w-4 h-4 flex items-center justify-center border shrink-0 \${formData.deliveryType === type ? 'border-[#C84200]' : 'border-[#1d1d1f]/20'}\`}>
                      {formData.deliveryType === type && <div className="w-2 h-2 rounded-full bg-[#C84200]" />}
                    </div>
                    <div>
                      <h4 className={\`font-bold text-sm \${formData.deliveryType === type ? 'text-[#C84200]' : 'text-[#1d1d1f]'}\`}>
                        {type === 'SHIPPING' ? 'Shipping Only' : type === 'MEETUP' ? 'Meetup / Pickup' : 'Shipping & Meetup'}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              <label className="block text-xs font-bold text-[#1d1d1f] mb-3">Listing Type`
);
fs.writeFileSync('src/components/catalog/ListBookForm.tsx', c);
