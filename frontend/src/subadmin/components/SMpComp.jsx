import React, { useEffect, useState } from 'react';
import '../../admin/styles/ma.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function SMpComp() {
  const [packages, setPackages] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('token');
  const admin = JSON.parse(localStorage.getItem('admin'));
  const role = admin?.role;

  const getPackages = async() => {
    try{
      const res = await axios.get('https://api.freelancing-projects.com/api/admin/get-packages',{
        headers:{
          Authorization: `Bearer ${token}`
        }
      })
      setPackages(res.data);
    }
    catch(err){
      if(err.response && err.response.data && err.response.data.message){
        alert(err.response.data.message);
      }
      else{
        alert('Error Getting Packages');
      }
    }
  }
  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    getPackages();
  }, []);

  

  const exportToExcel = () => {
    const data = filteredPackages.map((p, i) => ({
      "Sr No.": i + 1,
      "Package Name": p.name,
      "Price (Per Paragraph)": p.price,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packages");
    XLSX.writeFile(workbook, "PackagesList.xlsx");
  };


  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Packages List", 14, 15);

    const tableColumn = ["Sr No.", "Package Name", "Price (Per Paragraph)"];
    const tableRows = filteredPackages.map((p, i) => [
      i + 1,
      p.name,
      p.price,
      p.forms
    ]);

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("PackagesList.pdf");
  };

  return (
    <div className='comp'>
      <h3>Manage Packages</h3>
      <div className='incomp'>
        <div className='go'>
          <div className='mygo'>
            <p style={{ cursor: 'pointer' }}>Excel</p>
            <p style={{ cursor: 'pointer' }}>PDF</p>
          </div>
          <input
            type='text'
            className='search'
            placeholder='Search'
            
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th className='myth'>Sr.No.</th>
              <th className='myth'>Name</th>
              <th className='myth'>Price</th>
              <th className='myth'>No. of Forms</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pack,index)=>(
              <tr key={pack._id}>
                <td className='mytd'>{index+1}</td>
                <td className='mytd'>{pack.name}</td>
                <td className='mytd'>{pack.price}</td>
                <td className='mytd'>{pack.forms}</td>

              </tr> 
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SMpComp;
