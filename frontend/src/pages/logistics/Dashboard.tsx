import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Truck, Route, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import api from '@/services/api';

export default function LogisticsDashboard() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/logistics/deliveries');
      setDeliveries(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/logistics/deliveries/${id}/status`, {
        status: newStatus,
        driver: 'Raju Singh (Driver #1)',
        vehicle: 'MP09-AB-1234'
      });
      toast({ title: `Delivery Updated: ${newStatus}` });
      fetchDeliveries();
    } catch (e) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const pending = deliveries.filter(d => d.status === 'PENDING').length;
  const assigned = deliveries.filter(d => d.status === 'ASSIGNED').length;
  const inTransit = deliveries.filter(d => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP').length;
  const completed = deliveries.filter(d => d.status === 'DELIVERED').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Logistics & Dispatch Operations</h1>
          <p className="text-muted-foreground text-sm">Coordinate fleet assignments, track in-transit batches, and run multi-stop route optimization.</p>
        </div>
        <Link to="/logistics/route">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Route className="h-4 w-4" /> Smart Route Optimizer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Pending Pickups</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pending}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Assigned Vehicles</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{assigned}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">In Transit</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{inTransit}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Completed Deliveries</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Fulfillment Consignments ({deliveries.length})</CardTitle>
          <CardDescription>Live tracking and driver status updates</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading logistics log...</div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No active consignments.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Consignment</TableHead>
                  <TableHead>Origin / Farm</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Driver & Vehicle</TableHead>
                  <TableHead>Est. Distance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold">
                      #{d.orderId?.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {d.origin}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {d.destination}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.driver ? (
                        <div>
                          <div className="font-medium text-foreground">{d.driver}</div>
                          <div>{d.vehicle}</div>
                        </div>
                      ) : (
                        <span className="italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {d.distance ? `${d.distance} km` : 'Calculating...'}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        d.status === 'DELIVERED' ? 'bg-emerald-600' :
                        d.status === 'IN_TRANSIT' ? 'bg-indigo-600' :
                        d.status === 'PICKED_UP' ? 'bg-blue-600' :
                        d.status === 'ASSIGNED' ? 'bg-amber-500' : 'bg-slate-500'
                      }>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {d.status === 'PENDING' && (
                        <Button size="sm" className="h-7 text-xs bg-blue-600 text-white" onClick={() => handleUpdateStatus(d.id, 'ASSIGNED')}>
                          Assign Truck
                        </Button>
                      )}
                      {d.status === 'ASSIGNED' && (
                        <Button size="sm" className="h-7 text-xs bg-indigo-600 text-white" onClick={() => handleUpdateStatus(d.id, 'PICKED_UP')}>
                          Pickup
                        </Button>
                      )}
                      {d.status === 'PICKED_UP' && (
                        <Button size="sm" className="h-7 text-xs bg-purple-600 text-white" onClick={() => handleUpdateStatus(d.id, 'IN_TRANSIT')}>
                          In Transit
                        </Button>
                      )}
                      {d.status === 'IN_TRANSIT' && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 text-white" onClick={() => handleUpdateStatus(d.id, 'DELIVERED')}>
                          Mark Delivered
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
