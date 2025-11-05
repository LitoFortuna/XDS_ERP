import React, { useState } from 'react';
import { View, Student, Instructor, DanceClass, Payment, Cost, CostCategory } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import ClassSchedule from './components/ClassSchedule';
import InstructorList from './components/InstructorList';
import Billing from './components/Billing';
import InteractiveSchedule from './components/InteractiveSchedule';

const initialStudents: Student[] = [
    { id: 'C001', name: 'Romina Borges Llordes', birthDate: '2001-01-01', phone: '646422260', email: 'test@mail.com', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C002', name: 'Mercè Carretero Roman', birthDate: '', phone: '647750206', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C003', name: 'Anae Zarcero Meneses', birthDate: '', phone: '686815359', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C004', name: 'Olga Sales Saez', birthDate: '', phone: '658600365', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C005', name: 'Lluís Peña Bruguera', birthDate: '', phone: '667903059', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C006', name: 'Manu García Bonilla', birthDate: '', phone: '687446567', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C007', name: 'Laia Marín', birthDate: '', phone: '647568551', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C008', name: 'Erika Cardenas Choy', birthDate: '', phone: '661153064', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C009', name: 'Magda Benito de la Iglesia', birthDate: '', phone: '652447327', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C010', name: 'Elena Hernandez Fresno', birthDate: '', phone: '651856670', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C011', name: 'José Manuel Cáceres Rangel', birthDate: '', phone: '606711396', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C012', name: 'Sílvia Lorente Cazorla', birthDate: '', phone: '696610465', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C013', name: 'María Jesús Perez Peralta', birthDate: '', phone: '607449686', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C014', name: 'Pilar Valero Silva', birthDate: '', phone: '680630513', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C015', name: 'Alexandra Serna Jianu', birthDate: '', phone: '644392290', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C016', name: 'Ana Benito de la Iglesia', birthDate: '', phone: '696712678', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C017', name: 'Daniela Palabra', birthDate: '', phone: '679350358', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C018', name: 'Sandra Rodriguez Saiz', birthDate: '', phone: '606779643', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C019', name: 'Carla Canela Gardeñes', birthDate: '', phone: '620866928', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C020', name: 'Sara Conde', birthDate: '', phone: '664628500', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C021', name: 'Carlota Palabra', birthDate: '', phone: '679350358', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C022', name: 'Valeria Pages Eiros', birthDate: '', phone: '626801589', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C023', name: 'Mar Dominguez Cañavate', birthDate: '', phone: '666539489', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C024', name: 'Laia Fàbregas Castells', birthDate: '', phone: '609855627', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C025', name: 'Virginia González Sedano', birthDate: '', phone: '603838451', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C026', name: 'Irene Saez Roldan', birthDate: '', phone: '616052142', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C027', name: 'Isabel Gonzalez Andújar', birthDate: '', phone: '677216279', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C028', name: 'Sofia Canela Gardeñes', birthDate: '', phone: '620866928', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C029', name: 'Angela Beltrán', birthDate: '', phone: '670444476', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C030', name: 'Aroa Rubio Juy', birthDate: '', phone: '662094065', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C031', name: 'Bianka Villalba', birthDate: '', phone: '671090942', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C032', name: 'Natalia Creus', birthDate: '', phone: '609004497', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C033', name: 'Soledad López', birthDate: '', phone: '696892249', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C034', name: 'Ana Maria Moreno Pedrisa', birthDate: '', phone: '636608626', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C035', name: 'Milagros Vegas', birthDate: '', phone: '610250488', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C036', name: 'Txell Pitarque', birthDate: '', phone: '665416776', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C037', name: 'Berta Moral', birthDate: '', phone: '669326940', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C038', name: 'Vera Carballada', birthDate: '', phone: '635615973', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C039', name: 'Laura Andrada Fernandez', birthDate: '', phone: '678761247', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C040', name: 'Ana María González Navarro', birthDate: '', phone: '690868027', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C041', name: 'Alma Meneses Almirall', birthDate: '', phone: '647047847', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C042', name: 'Ester Villanueva Morales', birthDate: '', phone: '606038205', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C043', name: 'Amparo Rivadeneira Sanchez', birthDate: '', phone: '609808504', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C044', name: 'Raquel Garcia Molina', birthDate: '', phone: '649010449', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C045', name: 'María Padilla Hernández', birthDate: '', phone: '647542820', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C046', name: 'Pilar Hidalgo', birthDate: '', phone: '617221478', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C047', name: 'Eva Martínez', birthDate: '', phone: '653200313', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C048', name: 'Yolanda Padilla Hernández', birthDate: '', phone: '655068001', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C049', name: 'Miríam Clar Masip', birthDate: '', phone: '630146067', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C050', name: 'Mari Solis Moreno', birthDate: '', phone: '635615973', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C051', name: 'Laura Viñolo Mesa', birthDate: '', phone: '619502262', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C052', name: 'Maribel Gonzalez Gomez', birthDate: '', phone: '678953208', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C053', name: 'Silvia Soler Carrilero', birthDate: '', phone: '651127126', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C054', name: 'Marga Piñero', birthDate: '', phone: '619655751', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C055', name: 'Ángeles Piñero Romero', birthDate: '', phone: '679852600', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C056', name: 'Rocio Tiendas Marzo', birthDate: '', phone: '679627665', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C057', name: 'Marta Hernández Jorba', birthDate: '', phone: '610727451', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C058', name: 'Maria Lopez Vegas', birthDate: '', phone: '667550489', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C059', name: 'Andrea Lopez Belmonte', birthDate: '', phone: '656493813', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C060', name: 'Carol Tena', birthDate: '', phone: '677977993', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C061', name: 'Nuria Fernández', birthDate: '', phone: '635945572', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C062', name: 'Irene Chica Carrasco', birthDate: '', phone: '649894983', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C063', name: 'Ana Jiménez Tovar', birthDate: '', phone: '679253594', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C064', name: 'Marisa Lava Sanchez', birthDate: '', phone: '657055280', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C065', name: 'Lucia Aranda', birthDate: '', phone: '625640985', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C066', name: 'Nira Fernández Ordiales', birthDate: '', phone: '690055561', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C067', name: 'Carla Sánchez Viñolo', birthDate: '', phone: '619502262', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C068', name: 'Marie Carmen Esteban', birthDate: '', phone: '696213457', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C069', name: 'Anna Orea Ramos', birthDate: '', phone: '616656659', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C070', name: 'Aroa Pinilla Simarro', birthDate: '', phone: '636866520', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C071', name: 'Martina Fernandez Gomez', birthDate: '', phone: '616522742', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C072', name: 'Irene Espejo Sayago', birthDate: '', phone: '675342067', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C073', name: 'Yaiza Costa', birthDate: '', phone: '696341310', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C074', name: 'Rocio Solis', birthDate: '', phone: '628511466', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C075', name: 'Gemma Fernandez (Competi)', birthDate: '', phone: '669326940', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C076', name: 'Cristina Perez Perez', birthDate: '', phone: '659299412', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C077', name: 'Dolors Martí i Bort', birthDate: '', phone: '619848461', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C078', name: 'Elena Fernández Cerrillo', birthDate: '', phone: '655124119', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C079', name: 'Naia Artesero Pérez', birthDate: '', phone: '689297009', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C080', name: 'Mireia Linares Marzo', birthDate: '', phone: '676570766', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C081', name: 'Estefania Martin', birthDate: '', phone: '686740472', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C082', name: 'Noelia Seguer Áviles', birthDate: '', phone: '646096039', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C083', name: 'Laura Chanclet Rodriguez', birthDate: '', phone: '618083773', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C084', name: 'Naila Garcés López', birthDate: '', phone: '651932603', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C085', name: 'Montse Arjona', birthDate: '', phone: '699998303', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C086', name: 'Marta Espargallàs', birthDate: '', phone: '611180062', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C087', name: 'Candela Zarcero Meneses', birthDate: '', phone: '686815359', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C088', name: 'Berta Guzman Perez', birthDate: '', phone: '629055805', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C089', name: 'Berta Ventura Palma', birthDate: '', phone: '675957421', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C090', name: 'Carlota Constanti Casado', birthDate: '', phone: '687797559', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C091', name: 'Raquel Segura Tubau', birthDate: '', phone: '637146111', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C092', name: 'Cristina Jimenez Funes', birthDate: '', phone: '670930489', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C093', name: 'Indira Barba Moreno', birthDate: '', phone: '630147369', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C094', name: 'Marta Bartolí Riu', birthDate: '', phone: '679091774', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C095', name: 'Tamara Luis Román', birthDate: '', phone: '682699436', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C096', name: 'Inma Moreno', birthDate: '', phone: '630147369', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C097', name: 'Ela Maylen Caueso', birthDate: '', phone: '695681194', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C098', name: 'Sandra Casamian Bonet', birthDate: '', phone: '650781084', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C099', name: 'Raquel Reig Delsams', birthDate: '', phone: '654226668', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C100', name: 'Corayma Espino', birthDate: '', phone: '688875252', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C101', name: 'Anna Villa', birthDate: '', phone: '610285535', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C102', name: 'Inmaculada Bonilla Aguilar', birthDate: '', phone: '687446566', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C103', name: 'Irene Bonilla Mingorance', birthDate: '', phone: '648100042', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C104', name: 'Júlia Balsells Conchillo', birthDate: '', phone: '629658741', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C105', name: 'Lydia Lamaña Ortí', birthDate: '', phone: '652863482', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C106', name: 'Mireia Pérez Belchi', birthDate: '', phone: '696791511', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C107', name: 'Yolanda Montero Zapata', birthDate: '', phone: '680295772', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C108', name: 'Angélica Rios Luna', birthDate: '', phone: '665271453', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C109', name: 'Paola Cangas Olivarri', birthDate: '', phone: '699365415', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C110', name: 'Clara Blaya Tena', birthDate: '', phone: '677977993', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C111', name: 'Nuria Rodriguez Valverde', birthDate: '', phone: '620549333', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C112', name: 'Ana Sanchez Fernandez', birthDate: '', phone: '608726985', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C113', name: 'Ada Monge', birthDate: '', phone: '665058737', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C114', name: 'Maria Paredes (Paula)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C115', name: 'Cristina Gonzalez (Seynabou)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C116', name: 'Evelin Fernandez (Maria)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C117', name: 'Mireia Martinez (Vega)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C118', name: 'Patricia Mabel (Maricel)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C119', name: 'Rosa Segura (Hugo)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C120', name: 'Vanessa Martinez (June)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C121', name: 'Alejandro Isa(Ukyo)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C122', name: 'Chantal Marques (Valeria)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C123', name: 'Cristina Devesa (Julia)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C124', name: 'Flori Manzan (Mia)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C125', name: 'Francisco Araujo (Valeria)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C126', name: 'Guillem Peña (Noa)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C127', name: 'Ingrid Coll (Lluna)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C128', name: 'Jane Villanueva (Ivanna)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C129', name: 'Laura Esmerats (Lia)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C130', name: 'Marc Arquero (Alba)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C131', name: 'Margarita Vargas (Mar)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C132', name: 'Maria Angeles Serrano (Anna)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C133', name: 'Nuria Rodriguez Peiro (Emma)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C134', name: 'Vinavet Veronica (Laia)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C135', name: 'Jessica Revestido (Arnau)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C136', name: 'Ana Sánchez Bautista', birthDate: '', phone: '650588034', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C137', name: 'Laia Sedano Lafferthy', birthDate: '', phone: '671844218', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C138', name: 'Eric Montes Gonzalo', birthDate: '', phone: '628550896', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C139', name: 'Susana Viudez', birthDate: '', phone: '669338566', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C140', name: 'Jordi Planas Roca', birthDate: '', phone: '628296414', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C141', name: 'Mia Bedoya Escobar', birthDate: '', phone: '604217434', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C142', name: 'Ángeles Romero', birthDate: '', phone: '606566549', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C143', name: 'Dana Mireia Benitez', birthDate: '', phone: '698281583', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C144', name: 'Lara Romero Dominguez', birthDate: '', phone: '653662935', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C145', name: 'Nuria Sanz', birthDate: '', phone: '633683327', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C146', name: 'Sol Hurtado Campos', birthDate: '', phone: '617796886', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C147', name: 'Gemma Fernandez Millán', birthDate: '', phone: '650916644', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C148', name: 'Alicia Roca', birthDate: '', phone: '639073604', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C149', name: 'Mònica Jiménez Garcia', birthDate: '', phone: '609087263', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C150', name: 'Aida Monedero Muñoz', birthDate: '', phone: '645489601', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C151', name: 'Anais Muñoz', birthDate: '', phone: '674187089', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C152', name: 'Ada Almirall', birthDate: '', phone: '661096864', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C153', name: 'Sandra Borrallo Cabello', birthDate: '', phone: '690385569', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C154', name: 'Estela Casado', birthDate: '', phone: '687797559', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C155', name: 'Yolanda Artola Santmartí', birthDate: '', phone: '610057657', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C156', name: 'Samira Rodriguez', birthDate: '', phone: '605130019', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C157', name: 'Marc Esteban Mendoza', birthDate: '', phone: '603858625', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C158', name: 'Isabella Fernandez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C159', name: 'Jennifer Ruiz', birthDate: '', phone: '653081134', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C160', name: 'Graciela Chaves (Alana)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C161', name: 'Mary Beybi Bravo (Sofia)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 12, paymentMethod: 'Transferencia', active: false, notes: '' },
    { id: 'C162', name: 'Esther Barea', birthDate: '', phone: '686534385', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C163', name: 'Bradelyn Hiche', birthDate: '', phone: '697819396', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C164', name: 'Emma Griffitas Hurtado', birthDate: '', phone: '617796886', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C165', name: 'Eva Buenestado (Luc Thiago)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C166', name: 'Ángela Aldazabal Cubria', birthDate: '', phone: '611154506', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C167', name: 'Juliette Cánovas Sanchez', birthDate: '', phone: '603598230', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C168', name: 'Aina Piñol', birthDate: '', phone: '695349303', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C169', name: 'Estela Borras', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C170', name: 'Ramona Colmena Otero', birthDate: '', phone: '637402136', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C171', name: 'Alicia Prada', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C172', name: 'Yolanda Melero Lorenzo', birthDate: '', phone: '693804208', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C173', name: 'Cristina Gimenez Fernandez', birthDate: '', phone: '633608748', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C174', name: 'Davinia Torres', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C175', name: 'Leyre Ramirez Rodriguez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C176', name: 'Carla Enrique', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C177', name: 'Cristina Sanchez Lopez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C178', name: 'Loli Franco Ordoño', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C179', name: 'Elena Moral', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C180', name: 'Ainhoa Ortega', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C181', name: 'Emma Aragüelles', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C182', name: 'Jennifer Estevez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C183', name: 'Isadora Rodriguez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C184', name: 'Marta Pequeño', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C185', name: 'Gloria Caro Martinez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C186', name: 'Raquel Pujades', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C187', name: 'Manuela Martin', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C188', name: 'Alma Arenas', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C189', name: 'Martina Nicolás', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C190', name: 'Lola Carmona', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C191', name: 'Laia Fàbregas Franco', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C192', name: 'Jesús Ernesto', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C193', name: 'Laura Cerón', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C194', name: 'Marga + Juanjo', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C195', name: 'Ainara Espejo', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C196', name: 'Ámbar Samariego', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C197', name: 'Martina Gimenez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C198', name: 'Marta Rincón', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C199', name: 'Judit López', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C200', name: 'Juanjo & Saray', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C201', name: 'Manolo & Cristina', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 150, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C202', name: 'Sara Atanes & Andreu', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 150, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C203', name: 'Familia mayor', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 150, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C204', name: 'Francesca Tricarico & Sergio', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 150, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C205', name: 'Verónica Villegas', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C206', name: 'Anastasia Ventura Cañete', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C207', name: 'Marta Gomez Gomez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C208', name: 'Pepi Lopez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C209', name: 'Isabel Venegas', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C210', name: 'Eva Pizarro (Pilates)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C211', name: 'Pepe Peinado', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C212', name: 'Àngels', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C213', name: 'Xavi & Camila', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 150, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C214', name: 'Ana Gispert', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C215', name: 'Lidia Martín', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C216', name: 'Virginia Pintado', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C217', name: 'Fina', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C218', name: 'Mercedes', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C219', name: 'Yolanda Vicente', birthDate: '', phone: '607978675', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C220', name: 'Noelia Hernandez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C221', name: 'Josefa Del Amo', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C222', name: 'Vega Meneses', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C223', name: 'Sara Mendez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C224', name: 'Sara Atanes Agudo', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C225', name: 'Rosa Agudo', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C226', name: 'Laura Puig', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C227', name: 'Laura Ruiz Canela', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C228', name: 'Manoli Rosa Cañada', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C229', name: 'Jessica sanchez Muñoz', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C230', name: 'Mireia Lora Salas', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C231', name: 'Laia Rodriguez Barahona', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C232', name: 'Anna Durò Saguesa', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C233', name: 'Lina Herrera', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C234', name: 'Milagros Vegas Salazar', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C235', name: 'Blanca Garrido', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C236', name: 'Anna Soler Maza', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C237', name: 'Cindy Yanaly (heels)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C238', name: 'Lucia Puig Sousa', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C239', name: 'Carlos Fernandez (bachata)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C240', name: 'David Fernandez (bachata)', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C241', name: 'Sara san Juan', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C242', name: 'Laia Pareja', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C243', name: 'Marta Giménez Zacarés', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C244', name: 'Estela Borras', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C245', name: 'Mónica Jimenez', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C246', name: 'Elena Tarifa', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C247', name: 'Maria del Carmen Charles', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C248', name: 'Celma Rodriguez Barahona', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C249', name: 'Olga Vidal Asensio', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C250', name: 'Marta Martinez Melero', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C251', name: 'Marta Barahona', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C252', name: 'Amàlia Angulu', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C253', name: 'Cristina Vega', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' },
    { id: 'C254', name: 'Julio Carmona Bachata', birthDate: '', phone: '', email: '', enrolledClassIds: [], monthlyFee: 30, paymentMethod: 'Transferencia', active: true, notes: '' }
];


const initialInstructors: Instructor[] = [
    { id: 'inst_1', name: 'Pablo', email: 'pablo@xen.com', phone: '555-000-0001', specialties: ['Baile Moderno', 'Hip Hop'], ratePerClass: 35, active: true, hireDate: '2023-01-01' },
    { id: 'inst_2', name: 'Lucas', email: 'lucas@xen.com', phone: '555-000-0002', specialties: ['Baile Moderno', 'Contemporáneo'], ratePerClass: 35, active: true, hireDate: '2023-01-01' },
    { id: 'inst_3', name: 'Gisela', email: 'gisela@xen.com', phone: '555-000-0003', specialties: ['Zumba', 'Fitness'], ratePerClass: 30, active: true, hireDate: '2023-01-01' },
    { id: 'inst_4', name: 'Tamara', email: 'tamara@xen.com', phone: '555-000-0004', specialties: ['Fitness', 'Hip Hop'], ratePerClass: 30, active: true, hireDate: '2023-01-01' },
    { id: 'inst_5', name: 'Anna', email: 'anna@xen.com', phone: '555-000-0005', specialties: ['Ballet', 'Baile Moderno'], ratePerClass: 40, active: true, hireDate: '2023-01-01' },
    { id: 'inst_6', name: 'Joel & Rosa', email: 'joelyrosa@xen.com', phone: '555-000-0006', specialties: ['Baile Moderno'], ratePerClass: 50, active: true, hireDate: '2023-01-01' },
    { id: 'inst_7', name: 'Laura Pilates', email: 'laurap@xen.com', phone: '555-000-0007', specialties: ['Pilates'], ratePerClass: 40, active: true, hireDate: '2023-01-01' },
    { id: 'inst_8', name: 'Maria Isern', email: 'mariai@xen.com', phone: '555-000-0008', specialties: ['Fitness'], ratePerClass: 35, active: true, hireDate: '2023-01-01' },
    { id: 'inst_9', name: 'Emma (Madorell)', email: 'emma@xen.com', phone: '555-000-0009', specialties: ['Baile Moderno'], ratePerClass: 30, active: false, hireDate: '2023-01-01' },
    { id: 'inst_10', name: 'Xenia', email: 'xenia@xen.com', phone: '555-000-0010', specialties: ['Competición', 'Baile Moderno', 'Hip Hop'], ratePerClass: 45, active: true, hireDate: '2022-09-01' },
];

// Datos de clases actualizados según el PDF y reasignados a los nuevos instructores
const initialClasses: DanceClass[] = [
  { id: 'cls_1', name: 'Pilates', instructorId: 'inst_7', category: 'Especializada', days: ['Lunes'], startTime: '09:15', endTime: '10:15', capacity: 15, baseRate: 30 },
  { id: 'cls_2', name: 'Pilates Senior', instructorId: 'inst_7', category: 'Especializada', days: ['Lunes'], startTime: '10:15', endTime: '11:15', capacity: 15, baseRate: 30 },
  { id: 'cls_3', name: 'Total Body', instructorId: 'inst_3', category: 'Fitness', days: ['Lunes'], startTime: '15:15', endTime: '16:15', capacity: 20, baseRate: 25 },
  { id: 'cls_4', name: 'Babies Dance', instructorId: 'inst_5', category: 'Baile Moderno', days: ['Lunes'], startTime: '17:15', endTime: '18:15', capacity: 10, baseRate: 25 },
  { id: 'cls_5', name: 'Commercial II', instructorId: 'inst_1', category: 'Baile Moderno', days: ['Lunes'], startTime: '18:15', endTime: '19:15', capacity: 15, baseRate: 35 },
  { id: 'cls_6', name: 'Zumba', instructorId: 'inst_3', category: 'Fitness', days: ['Lunes'], startTime: '19:15', endTime: '20:00', capacity: 20, baseRate: 25 },
  { id: 'cls_7', name: 'Pilates', instructorId: 'inst_7', category: 'Especializada', days: ['Lunes'], startTime: '20:00', endTime: '20:45', capacity: 15, baseRate: 30 },
  { id: 'cls_8', name: 'Cardio Tono', instructorId: 'inst_4', category: 'Fitness', days: ['Lunes'], startTime: '20:45', endTime: '21:30', capacity: 20, baseRate: 25 },
  { id: 'cls_9', name: 'Zumba Senior', instructorId: 'inst_3', category: 'Fitness', days: ['Martes'], startTime: '08:30', endTime: '09:15', capacity: 15, baseRate: 25 },
  { id: 'cls_10', name: 'Gimn. Preparto & Postparto', instructorId: 'inst_8', category: 'Especializada', days: ['Martes'], startTime: '10:15', endTime: '11:15', capacity: 10, baseRate: 40 },
  { id: 'cls_11', name: 'Pilates suave e Hipopresivos', instructorId: 'inst_7', category: 'Especializada', days: ['Martes'], startTime: '15:15', endTime: '16:15', capacity: 15, baseRate: 35 },
  { id: 'cls_12', name: 'Commercial I', instructorId: 'inst_1', category: 'Baile Moderno', days: ['Martes'], startTime: '17:15', endTime: '18:15', capacity: 15, baseRate: 35 },
  { id: 'cls_13', name: 'Reggaeton', instructorId: 'inst_2', category: 'Baile Moderno', days: ['Martes'], startTime: '18:15', endTime: '19:15', capacity: 18, baseRate: 35 },
  { id: 'cls_14', name: 'Pilates', instructorId: 'inst_7', category: 'Especializada', days: ['Martes'], startTime: '19:15', endTime: '20:00', capacity: 15, baseRate: 30 },
  { id: 'cls_15', name: 'Zumba', instructorId: 'inst_3', category: 'Fitness', days: ['Martes'], startTime: '20:00', endTime: '20:45', capacity: 20, baseRate: 25 },
  { id: 'cls_16', name: 'Pilates', instructorId: 'inst_7', category: 'Especializada', days: ['Martes'], startTime: '20:45', endTime: '21:30', capacity: 15, baseRate: 30 },
  { id: 'cls_17', name: 'Cardio Tono', instructorId: 'inst_4', category: 'Fitness', days: ['Miércoles'], startTime: '09:15', endTime: '10:15', capacity: 20, baseRate: 25 },
  { id: 'cls_18', name: 'Gimnasia Funcional Senior', instructorId: 'inst_8', category: 'Especializada', days: ['Miércoles'], startTime: '10:15', endTime: '11:15', capacity: 15, baseRate: 30 },
  { id: 'cls_19', name: 'Cardio Tono', instructorId: 'inst_4', category: 'Fitness', days: ['Miércoles'], startTime: '15:15', endTime: '16:15', capacity: 20, baseRate: 25 },
  { id: 'cls_20', name: 'Urbano', instructorId: 'inst_2', category: 'Baile Moderno', days: ['Miércoles'], startTime: '17:15', endTime: '18:15', capacity: 18, baseRate: 35 },
  { id: 'cls_21', name: 'Urbano', instructorId: 'inst_2', category: 'Baile Moderno', days: ['Miércoles'], startTime: '18:15', endTime: '19:15', capacity: 18, baseRate: 35 },
  { id: 'cls_22', name: 'Cardio Tono', instructorId: 'inst_4', category: 'Fitness', days: ['Miércoles'], startTime: '19:15', endTime: '20:00', capacity: 20, baseRate: 25 },
  { id: 'cls_23', name: 'Urbano', instructorId: 'inst_2', category: 'Baile Moderno', days: ['Miércoles'], startTime: '20:00', endTime: '21:00', capacity: 18, baseRate: 35 },
  { id: 'cls_24', name: 'Salsa & Bachata', instructorId: 'inst_6', category: 'Baile Moderno', days: ['Miércoles'], startTime: '21:00', endTime: '22:00', capacity: 20, baseRate: 35 },
  { id: 'cls_25', name: 'Gimn. Preparto & Postparto', instructorId: 'inst_8', category: 'Especializada', days: ['Jueves'], startTime: '09:15', endTime: '10:15', capacity: 10, baseRate: 40 },
  { id: 'cls_26', name: 'Pilates', instructorId: 'inst_7', category: 'Especializada', days: ['Jueves'], startTime: '15:15', endTime: '16:15', capacity: 15, baseRate: 30 },
  { id: 'cls_27', name: 'Fusión I', instructorId: 'inst_1', category: 'Baile Moderno', days: ['Jueves'], startTime: '17:15', endTime: '18:15', capacity: 15, baseRate: 35 },
  { id: 'cls_28', name: 'Fusión II', instructorId: 'inst_1', category: 'Baile Moderno', days: ['Jueves'], startTime: '18:15', endTime: '19:00', capacity: 15, baseRate: 35 },
  { id: 'cls_29', name: 'Zumba', instructorId: 'inst_3', category: 'Fitness', days: ['Jueves'], startTime: '19:00', endTime: '19:45', capacity: 20, baseRate: 25 },
  { id: 'cls_30', name: 'Pilates', instructorId: 'inst_7', category: 'Especializada', days: ['Jueves'], startTime: '19:45', endTime: '20:30', capacity: 15, baseRate: 30 },
  { id: 'cls_31', name: 'Salsa & Bachata', instructorId: 'inst_6', category: 'Baile Moderno', days: ['Jueves'], startTime: '20:30', endTime: '21:30', capacity: 20, baseRate: 35 },
  { id: 'cls_32', name: 'Zumba Senior', instructorId: 'inst_3', category: 'Fitness', days: ['Viernes'], startTime: '08:30', endTime: '09:15', capacity: 15, baseRate: 25 },
  { id: 'cls_33', name: 'Competición Junior', instructorId: 'inst_10', category: 'Competición', days: ['Viernes'], startTime: '17:15', endTime: '18:15', capacity: 12, baseRate: 45 },
  { id: 'cls_34', name: 'Competición Junior', instructorId: 'inst_10', category: 'Competición', days: ['Viernes'], startTime: '18:15', endTime: '19:15', capacity: 12, baseRate: 45 },
  { id: 'cls_35', name: 'Heels', instructorId: 'inst_1', category: 'Baile Moderno', days: ['Viernes'], startTime: '19:15', endTime: '20:00', capacity: 15, baseRate: 35 },
  { id: 'cls_36', name: 'Competición Premium', instructorId: 'inst_10', category: 'Competición', days: ['Viernes'], startTime: '20:00', endTime: '21:00', capacity: 10, baseRate: 50 },
];

const initialPayments: Payment[] = []; // Cleared to maintain data consistency

const initialCosts: Cost[] = [
    { id: 'cost_1', paymentDate: '2024-07-01', category: 'Alquiler', beneficiary: 'Inmobiliaria Central', concept: 'Alquiler Local Julio', amount: 1200, paymentMethod: 'Transferencia', isRecurring: true },
    { id: 'cost_2', paymentDate: '2024-07-05', category: 'Profesores', beneficiary: 'Isabella Rossi', concept: 'Nómina Junio', amount: 800, paymentMethod: 'Transferencia', isRecurring: true },
    { id: 'cost_3', paymentDate: '2024-07-10', category: 'Suministros', beneficiary: 'Compañía Eléctrica', concept: 'Factura Luz Junio', amount: 150, paymentMethod: 'Domiciliación', isRecurring: true },
];

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [instructors, setInstructors] = useState<Instructor[]>(initialInstructors);
    const [classes, setClasses] = useState<DanceClass[]>(initialClasses);
    const [payments, setPayments] = useState<Payment[]>(initialPayments);
    const [costs, setCosts] = useState<Cost[]>(initialCosts);

    // Student Handlers
    const addStudent = (student: Omit<Student, 'id'>) => {
        const newStudent: Student = { 
            ...student, 
            id: `stu_${Date.now()}`,
            monthlyFee: student.monthlyFee || 19,
            paymentMethod: student.paymentMethod || 'Efectivo',
            enrolledClassIds: student.enrolledClassIds || [],
        };
        setStudents(prev => [...prev, newStudent]);
    };
    const updateStudent = (updatedStudent: Student) => {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    };

    // Instructor Handlers
    const addInstructor = (instructor: Omit<Instructor, 'id'>) => {
        const newInstructor: Instructor = { 
            ...instructor, 
            id: `inst_${Date.now()}`,
            active: instructor.active !== undefined ? instructor.active : true,
            hireDate: instructor.hireDate || new Date().toISOString().split('T')[0],
        };
        setInstructors(prev => [...prev, newInstructor]);
    };
    const updateInstructor = (updatedInstructor: Instructor) => {
        setInstructors(prev => prev.map(i => i.id === updatedInstructor.id ? updatedInstructor : i));
    };
    const deleteInstructor = (instructorId: string) => {
        const isAssigned = classes.some(c => c.instructorId === instructorId);
        if (isAssigned) {
            alert('Este profesor está asignado a clases. Por favor, reasigna esas clases antes de eliminarlo.');
            return;
        }
        setInstructors(prev => prev.filter(i => i.id !== instructorId));
    };


    // Class Handlers
    const addClass = (danceClass: Omit<DanceClass, 'id'>) => {
        const newClass = { ...danceClass, id: `cls_${Date.now()}` };
        setClasses(prev => [...prev, newClass]);
    };
    const updateClass = (updatedClass: DanceClass) => {
        setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
    };
    const deleteClass = (classId: string) => {
        // Remove class from classes list
        setClasses(prev => prev.filter(c => c.id !== classId));

        // Un-enroll students from the deleted class
        setStudents(prevStudents => 
            prevStudents.map(student => {
                if (student.enrolledClassIds.includes(classId)) {
                    return {
                        ...student,
                        enrolledClassIds: student.enrolledClassIds.filter(id => id !== classId)
                    };
                }
                return student;
            })
        );
    };
    
    // Payment Handlers
    const addPayment = (payment: Omit<Payment, 'id'>) => {
        const newPayment: Payment = {
            ...payment,
            id: `pay_${Date.now()}`
        };
        setPayments(prev => [...prev, newPayment]);
    };

    // Cost Handlers
    const addCost = (cost: Omit<Cost, 'id'>) => {
        const newCost = { ...cost, id: `cost_${Date.now()}` };
        setCosts(prev => [...prev, newCost]);
    };
    const updateCost = (updatedCost: Cost) => {
        setCosts(prev => prev.map(c => c.id === updatedCost.id ? updatedCost : c));
    };
    const deleteCost = (costId: string) => {
        setCosts(prev => prev.filter(c => c.id !== costId));
    };


    const renderView = () => {
        switch (currentView) {
            case View.DASHBOARD:
                return <Dashboard students={students} classes={classes} instructors={instructors} payments={payments} />;
            case View.STUDENTS:
                return <StudentList students={students} classes={classes} addStudent={addStudent} updateStudent={updateStudent} />;
            case View.CLASSES:
                return <ClassSchedule classes={classes} instructors={instructors} students={students} addClass={addClass} updateClass={updateClass} deleteClass={deleteClass} />;
            case View.INTERACTIVE_SCHEDULE:
                return <InteractiveSchedule classes={classes} instructors={instructors} students={students} updateClass={updateClass} />;
            case View.INSTRUCTORS:
                return <InstructorList instructors={instructors} classes={classes} addInstructor={addInstructor} updateInstructor={updateInstructor} deleteInstructor={deleteInstructor} />;
            case View.BILLING:
                return <Billing payments={payments} costs={costs} students={students} addPayment={addPayment} addCost={addCost} updateCost={updateCost} deleteCost={deleteCost} />;
            default:
                return <Dashboard students={students} classes={classes} instructors={instructors} payments={payments} />;
        }
    };

    return (
        <div className="relative min-h-screen lg:flex font-sans">
            <Sidebar 
                currentView={currentView} 
                setView={setCurrentView} 
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Header setIsOpen={setSidebarOpen} />
                <main className="flex-1 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;