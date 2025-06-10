import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Card, Spinner, Alert, Container, ListGroup, Button } from 'react-bootstrap';
import { ArrowLeft, TicketPerforated } from 'react-bootstrap-icons';
import { type CentroDeCostoDto } from '../types/centrosCosto';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';


const tipoMap = { 0: "Proyecto", 1: "Producto", 2: "Contrato" };

const CentroDeCostoDetailPage: React.FC = () => {
    const { centroDeCostoId } = useParams<{ centroDeCostoId: string }>();
    const [centroDeCosto, setCentroDeCosto] = useState<CentroDeCostoDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate(); 
    const { tienePermiso } = useAuth(); 

    useEffect(() => {
        if (!centroDeCostoId) return;
        setLoading(true);
        apiClient.get<CentroDeCostoDto>(`/api/centrosdecosto/${centroDeCostoId}`)
            .then(response => {
                setCentroDeCosto(response.data);
                setLoading(false);
            })
            .catch(err => {
                setError("Error al cargar los detalles del Centro de Costo.");
                setLoading(false);
            });
    }, [centroDeCostoId]);

    const handleCrearTicket = () => {
        if (!centroDeCosto) return;


        navigate('/tickets/nuevo', {
            state: {
                defaultCentroDeCosto: {
                    centroDeCostoID: centroDeCosto.centroDeCostoID,
                    nombre: centroDeCosto.nombre
                }
            }
        });
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!centroDeCosto) return <Alert variant="warning">No se encontró el Centro de Costo.</Alert>;

    return (
        <Container fluid>
            <Link
                to="/centros-costo"
                className="btn btn-outline-secondary btn-sm mb-3"
            >
                <ArrowLeft /> Volver a la lista
            </Link>
            <Card className="mb-4">
                <Card.Header>
                    <h1 className="h4 mb-0">Detalles de: {centroDeCosto.nombre}</h1>
                    {tienePermiso(Permisos.CrearTickets) && (
                        <Button variant="primary" onClick={handleCrearTicket}>
                            <TicketPerforated className="me-2"/>
                            Crear Ticket Vinculado
                        </Button>
                    )}
                </Card.Header>
                <Card.Body>
                    <p><strong>Descripción:</strong> {centroDeCosto.descripcion || "N/A"}</p>
                    <p><strong>Tipo:</strong> {tipoMap[centroDeCosto.tipo]}</p>
                    <p><strong>Responsable:</strong> {centroDeCosto.usuarioResponsable?.nombreCompleto || "N/A"}</p>
                    <h6>Participantes:</h6>
                    <ListGroup>
                        {centroDeCosto.participantes.map(p => <ListGroup.Item key={p.id}>{p.nombreCompleto}</ListGroup.Item>)}
                    </ListGroup>
                </Card.Body>
            </Card>

            <h2 className="h5 mb-3">Tablero de Tickets</h2>
            <KanbanBoard tickets={centroDeCosto.tickets} />
        </Container>
    );
};

export default CentroDeCostoDetailPage;