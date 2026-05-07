import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings2, 
  AlertCircle,
  MoreVertical,
  Check,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { funnelsApi, transitionRulesApi } from '../../api/settings';
import type { Funnel, FunnelStage, StageTransitionRule, TransitionMode } from '../../api/settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'react-hot-toast';

/**
 * Settings page for managing CRM funnels, stages, and transition rules.
 * Allows administrators to define the sales process and restrict deal movements.
 * 
 * @returns {JSX.Element} The FunnelsSettings component.
 */
export const FunnelsSettings: React.FC = () => {
  const { t } = useTranslation();
  
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [rules, setRules] = useState<StageTransitionRule[]>([]);
  const [activeTab, setActiveTab] = useState('stages');
  
  const [loading, setLoading] = useState(true);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newStageName, setNewStageName] = useState('');
  
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState<{
    fromStageId: string;
    toStageId: string;
    roles: string[];
  }>({
    fromStageId: 'any',
    toStageId: '',
    roles: []
  });

  const availableRoles = [
    { id: 'manager', label: t('settings.funnels.roles.manager') },
    { id: 'senior_manager', label: t('settings.funnels.roles.senior_manager') },
    { id: 'director', label: t('settings.funnels.roles.director') },
  ];

  useEffect(() => {
    loadFunnels();
  }, []);

  useEffect(() => {
    if (selectedFunnel) {
      loadStages(selectedFunnel.id);
      loadRules(selectedFunnel.id);
    } else {
      setStages([]);
      setRules([]);
    }
  }, [selectedFunnel]);

  /** Loads all funnels for the current organization. */
  const loadFunnels = async () => {
    try {
      setLoading(true);
      const data = await funnelsApi.getAll();
      setFunnels(data);
      if (data.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data[0]);
      }
    } catch (error) {
      console.error('Failed to load funnels:', error);
      toast.error(t('settings.funnels.loadError'));
    } finally {
      setLoading(false);
    }
  };

  /** Loads stages for a specific funnel. */
  const loadStages = async (funnelId: string) => {
    try {
      const data = await funnelsApi.getStages(funnelId);
      setStages(data.sort((a, b) => (a.orderIdx || 0) - (b.orderIdx || 0)));
    } catch (error) {
      console.error('Failed to load stages:', error);
    }
  };

  /** Loads transition rules for a specific funnel. */
  const loadRules = async (funnelId: string) => {
    try {
      const data = await transitionRulesApi.getByFunnel(funnelId);
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  /** Creates a new funnel. */
  const handleCreateFunnel = async () => {
    if (!newFunnelName.trim()) return;
    try {
      const newFunnel = await funnelsApi.createFunnel(newFunnelName);
      // Update transition mode if needed
      await funnelsApi.updateFunnel(newFunnel.id, { transitionMode: 'any' });
      const updatedFunnel = { ...newFunnel, transitionMode: 'any' as const };
      setFunnels([...funnels, updatedFunnel]);
      setSelectedFunnel(updatedFunnel);
      setNewFunnelName('');
      toast.success(t('common.saveSuccess'));
    } catch (error) {
      toast.error(t('common.saveError'));
    }
  };

  /** Adds a new stage to the current funnel. */
  const handleAddStage = async (statusType: FunnelStage['statusType'] = 'open') => {
    if (!newStageName.trim() || !selectedFunnel) return;
    try {
      const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.orderIdx || 0)) + 10 : 10;
      const newStage = await funnelsApi.createStage({
        funnelId: selectedFunnel.id,
        name: newStageName,
        statusType,
        orderIdx: nextOrder,
        color: statusType === 'won' ? '#10b981' : statusType === 'lost' ? '#ef4444' : '#3b82f6'
      });
      setStages([...stages, newStage]);
      setNewStageName('');
      toast.success(t('common.saveSuccess'));
    } catch (error) {
      toast.error(t('common.saveError'));
    }
  };

  /** Deletes a funnel after confirmation. */
  const handleDeleteFunnel = async (id: string) => {
    if (!window.confirm(t('settings.funnels.confirmDeleteFunnel'))) return;
    try {
      await funnelsApi.deleteFunnel(id);
      setFunnels(funnels.filter(f => f.id !== id));
      if (selectedFunnel?.id === id) {
        setSelectedFunnel(funnels.find(f => f.id !== id) || null);
      }
      toast.success(t('common.deleteSuccess'));
    } catch (error: any) {
      if (error.message?.includes('deals')) {
        toast.error(t('settings.funnels.deleteFunnelBlocked'));
      } else {
        toast.error(t('settings.funnels.deleteFunnelError'));
      }
    }
  };

  /** Deletes a stage after confirmation. */
  const handleDeleteStage = async (id: string) => {
    if (!window.confirm(t('settings.funnels.confirmDeleteStage'))) return;
    try {
      await funnelsApi.deleteStage(id);
      setStages(stages.filter(s => s.id !== id));
      toast.success(t('common.deleteSuccess'));
    } catch (error: any) {
      if (error.message?.includes('deals')) {
        toast.error(t('settings.funnels.deleteStageBlocked'));
      } else {
        toast.error(t('settings.funnels.deleteStageError'));
      }
    }
  };

  /** Toggles the transition mode for the current funnel. */
  const handleToggleMode = async (mode: TransitionMode) => {
    if (!selectedFunnel) return;
    try {
      await funnelsApi.updateFunnel(selectedFunnel.id, { transitionMode: mode });
      const updated = { ...selectedFunnel, transitionMode: mode };
      setSelectedFunnel(updated);
      setFunnels(funnels.map(f => f.id === updated.id ? updated : f));
      toast.success(t('common.saveSuccess'));
    } catch (error) {
      toast.error(t('common.saveError'));
    }
  };

  /** Seeds default linear rules for the funnel. */
  const handleSeedDefaults = async () => {
    if (!selectedFunnel) return;
    if (stages.length === 0) {
      toast.error(t('settings.funnels.noStagesToSeed') || 'Добавьте этапы воронки перед созданием правил');
      return;
    }
    try {
      await transitionRulesApi.seedDefaultRules(selectedFunnel.id, stages);
      await loadRules(selectedFunnel.id);
      toast.success(t('settings.funnels.seedSuccess'));
    } catch (error) {
      console.error('seedDefaultRules error:', error);
      toast.error(t('common.saveError'));
    }
  };

  /** Adds a custom transition rule. */
  const handleAddRule = async () => {
    if (!selectedFunnel || !newRule.toStageId) return;
    try {
      const rule = await transitionRulesApi.create(
        selectedFunnel.id,
        newRule.fromStageId === 'any' ? null : newRule.fromStageId,
        newRule.toStageId,
        newRule.roles
      );
      setRules([...rules, rule]);
      setIsAddRuleOpen(false);
      setNewRule({ fromStageId: 'any', toStageId: '', roles: [] });
      toast.success(t('common.saveSuccess'));
    } catch (error) {
      toast.error(t('common.saveError'));
    }
  };

  /** Deletes a transition rule. */
  const handleDeleteRule = async (id: string) => {
    try {
      await transitionRulesApi.delete(id);
      setRules(rules.filter(r => r.id !== id));
      toast.success(t('common.deleteSuccess'));
    } catch (error) {
      toast.error(t('common.deleteError'));
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('settings.funnels.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder={t('settings.funnels.newFunnelPrompt')}
            value={newFunnelName}
            onChange={(e) => setNewFunnelName(e.target.value)}
            className="flex-1 sm:w-64"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFunnel()}
          />
          <Button onClick={handleCreateFunnel} disabled={!newFunnelName.trim()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {t('settings.funnels.createFunnel')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Funnels List */}
        <Card className="lg:col-span-3 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('settings.funnels.listTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {funnels.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  {t('settings.funnels.emptyFunnels')}
                </div>
              ) : (
                funnels.map(f => (
                  <div
                    key={f.id}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between group transition-colors cursor-pointer ${
                      selectedFunnel?.id === f.id 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-3 overflow-hidden flex-1"
                      onClick={() => setSelectedFunnel(f)}
                    >
                      <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100" />
                      <span className="truncate font-medium">{f.name}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFunnel(f.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Funnel Details (Stages & Rules) */}
        <div className="lg:col-span-9 space-y-6">
          {!selectedFunnel ? (
            <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Settings2 className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('settings.funnels.selectHint')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedFunnel.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Shield className={`w-3.5 h-3.5 ${selectedFunnel.transitionMode === 'restricted' ? 'text-amber-500' : 'text-slate-400'}`} />
                      {selectedFunnel.transitionMode === 'restricted' 
                        ? t('settings.funnels.modeRestricted') 
                        : t('settings.funnels.modeAny')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={selectedFunnel.transitionMode === 'any' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleMode('any')}
                    >
                      {selectedFunnel.transitionMode === 'any' && <Check className="w-3.5 h-3.5 mr-1" />}
                      Any
                    </Button>
                    <Button 
                      variant={selectedFunnel.transitionMode === 'restricted' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleMode('restricted')}
                    >
                      {selectedFunnel.transitionMode === 'restricted' && <Check className="w-3.5 h-3.5 mr-1" />}
                      Restricted
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="stages">{t('settings.funnels.tabStages')}</TabsTrigger>
                      <TabsTrigger value="rules">{t('settings.funnels.tabTransitions')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stages" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Input
                          placeholder={t('settings.funnels.newStagePrompt')}
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button disabled={!newStageName.trim()}>
                              <Plus className="w-4 h-4 mr-2" />
                              {t('settings.funnels.addStage')}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleAddStage('open')}>
                              <Badge className="mr-2 bg-blue-500 hover:bg-blue-600">{t('settings.funnels.typeOpen')}</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddStage('won')}>
                              <Badge className="mr-2 bg-emerald-500 hover:bg-emerald-600">{t('settings.funnels.typeWon')}</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddStage('lost')}>
                              <Badge className="mr-2 bg-rose-500 hover:bg-rose-600">{t('settings.funnels.typeLost')}</Badge>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        {stages.length === 0 ? (
                          <p className="text-center py-8 text-slate-400 text-sm">{t('settings.funnels.emptyStages')}</p>
                        ) : (
                          stages.map((stage) => (
                            <div 
                              key={stage.id}
                              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg group"
                            >
                              <div 
                                className="w-1.5 h-8 rounded-full" 
                                style={{ backgroundColor: stage.color || '#3b82f6' }} 
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{stage.name}</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  {t(`settings.funnels.type${stage.statusType.charAt(0).toUpperCase() + stage.statusType.slice(1)}`)}
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                                onClick={() => handleDeleteStage(stage.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="rules" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                          {rules.length} {t('settings.funnels.tabTransitions').toLowerCase()}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleSeedDefaults}>
                            <Zap className="w-4 h-4 mr-2 text-amber-500" />
                            {t('settings.funnels.seedDefaultRules')}
                          </Button>
                          <Button size="sm" onClick={() => setIsAddRuleOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('settings.funnels.addRule')}
                          </Button>
                        </div>
                      </div>

                      {selectedFunnel.transitionMode === 'any' && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3 text-xs text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <p>{t('settings.funnels.modeAny')} — {t('settings.funnels.restrictedModeNote')}</p>
                        </div>
                      )}

                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
                            <tr>
                              <th className="px-4 py-3 text-left">{t('settings.funnels.ruleFromStage')}</th>
                              <th className="px-4 py-3 text-center w-10"></th>
                              <th className="px-4 py-3 text-left">{t('settings.funnels.ruleToStage')}</th>
                              <th className="px-4 py-3 text-left">{t('settings.funnels.ruleRoles')}</th>
                              <th className="px-4 py-3 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rules.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                                  {t('settings.funnels.noRules')}
                                </td>
                              </tr>
                            ) : (
                              rules.map(rule => {
                                const from = stages.find(s => s.id === rule.fromStageId);
                                const to = stages.find(s => s.id === rule.toStageId);
                                const roles = rule.allowedRoles || [];
                                
                                return (
                                  <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3">
                                      {from ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: from.color }} />
                                          {from.name}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">{t('settings.funnels.fromAny')}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: to?.color }} />
                                        {to?.name || 'Unknown'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        {roles.length === 0 ? (
                                          <Badge variant="outline" className="text-[10px] py-0">{t('settings.funnels.allRoles')}</Badge>
                                        ) : (
                                          roles.map((r: string) => (
                                            <Badge key={r} variant="secondary" className="text-[10px] py-0">
                                              {availableRoles.find(role => role.id === r)?.label || r}
                                            </Badge>
                                          ))
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                                        onClick={() => handleDeleteRule(rule.id)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('settings.funnels.addRuleTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.funnels.seedDefaultRulesHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t('settings.funnels.ruleFromStage')}
                </label>
                <Select 
                  value={newRule.fromStageId} 
                  onValueChange={(val) => setNewRule({...newRule, fromStageId: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t('settings.funnels.fromAny')}</SelectItem>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t('settings.funnels.ruleToStage')}
                </label>
                <Select 
                  value={newRule.toStageId} 
                  onValueChange={(val) => setNewRule({...newRule, toStageId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('settings.funnels.selectHint')} />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t('settings.funnels.ruleRoles')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableRoles.map(role => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role.id}`} 
                      checked={newRule.roles.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRule({...newRule, roles: [...newRule.roles, role.id]});
                        } else {
                          setNewRule({...newRule, roles: newRule.roles.filter(r => r !== role.id)});
                        }
                      }}
                    />
                    <label 
                      htmlFor={`role-${role.id}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * {t('settings.funnels.allRoles')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddRule} disabled={!newRule.toStageId}>
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelsSettings;
