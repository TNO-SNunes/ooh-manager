# Regras de Negócio — OOH Manager

## 1. Calendário de reservas por tipo de ponto

### 1.1 Outdoor — bissemanas obrigatórias

```
Regra: reservas DEVEM coincidir exatamente com bissemanas do mês.
  - Bissemana 1: dia 1 até dia 15
  - Bissemana 2: dia 16 até último dia do mês (28/29/30/31)

Validação ao criar reserva de Outdoor:
  1. data_inicio deve ser dia 1 ou dia 16 do mês
  2. data_fim deve ser dia 15 ou último dia do mês
  3. Não pode cruzar meses (cada bissemana é dentro do mês)

Exemplo válido:   01/05 → 15/05
Exemplo inválido: 05/05 → 20/05

Lógica de normalização:
  function normalizarBissemana(data: Date): { inicio: Date, fim: Date } {
    const dia = data.getDate()
    if (dia <= 15) return { inicio: setDia(data, 1), fim: setDia(data, 15) }
    else return { inicio: setDia(data, 16), fim: ultimoDiaDoMes(data) }
  }
```

### 1.2 Frontlight — mínimo 30 dias

```
Regra: data_fim - data_inicio >= 30 dias (inclusive)
  - Sem restrição de dia de início/fim
  - Apenas 1 cliente por período (sem sobreposição)

Validação:
  diff = data_fim - data_inicio
  if (diff < 30) throw "Frontlight requer mínimo de 30 dias"
```

### 1.3 Empena — mínimo 30 dias

```
Mesmas regras do Frontlight.
```

### 1.4 LED / DOOH — múltiplos clientes simultâneos

```
Regra especial: LED aceita N clientes ao mesmo tempo, cada um em um slot do loop.

Variáveis do ponto:
  - slots_totais: total de slots disponíveis (ex: 6)
  - slot_duracao_s: duração de cada slot em segundos (ex: 10s)
  - Loop total: slots_totais × slot_duracao_s (ex: 60s)

Ao criar reserva em LED:
  1. Verificar quantos slots estão ocupados no período solicitado
  2. Se slots_ocupados < slots_totais: permitir, atribuir próximo slot livre
  3. Se slots_ocupados == slots_totais: bloquear ("loop lotado no período")
  4. slot_numero é atribuído automaticamente (primeiro livre)

Query de verificação:
  SELECT COUNT(*) as ocupados, array_agg(slot_numero) as slots_em_uso
  FROM reservas
  WHERE ponto_id = $1
    AND status IN ('solicitada', 'ativa')
    AND data_inicio <= $data_fim
    AND data_fim >= $data_inicio
```

---

## 2. Conflito de reservas — regra de bloqueio temporário

```
Ao criar reserva com status 'solicitada':
  - O período fica IMEDIATAMENTE bloqueado para outros vendedores
  - Nenhum outro vendedor pode solicitar o mesmo ponto/período enquanto
    houver uma solicitação ativa

Comportamentos por status:
  'solicitada' → bloqueia o período (nenhum outro pode solicitar)
  'ativa'      → período confirmado, continua bloqueado
  'rejeitada'  → período liberado (outros podem solicitar)
  'cancelada'  → período liberado
  'finalizada' → período liberado

Para LED: o bloqueio é por slot, não por período inteiro.
```

---

## 3. Fluxo de aprovação de reservas

```
Vendedor cria reserva
  → status: 'solicitada'
  → Gerente recebe notificação em tempo real

Gerente aprova
  → status: 'ativa'
  → aprovador_id = gerente.id
  → aprovado_em = NOW()
  → Vendedor recebe notificação

Gerente rejeita
  → status: 'rejeitada'
  → motivo_rejeicao OBRIGATÓRIO (não pode ser vazio)
  → aprovador_id = gerente.id
  → Período liberado imediatamente
  → Vendedor recebe notificação com motivo

Gerente cria diretamente
  → status: 'ativa' (pula o fluxo de solicitação)
  → vendedor_id pode ser qualquer vendedor da empresa
```

---

## 4. Bloqueio por Manutenção

```
Gerente/Admin pode criar bloqueio de manutenção em qualquer ponto.

Regras:
  - Bloqueio impede NOVAS solicitações no período
  - Reservas já 'ativas' no período NÃO são canceladas automaticamente
    (gerente deve tratar manualmente — avisar cliente etc.)
  - Sistema deve alertar: "Existem X reservas ativas neste período"
    antes de confirmar o bloqueio

Verificação de disponibilidade deve considerar bloqueios:
  - Ponto com status 'manutencao' = bloqueado globalmente
  - Bloqueio pontual via tabela bloqueios_manutencao = bloqueado no período
```

---

## 5. Fluxo de OS e Photo Checking

### 5.1 Criação de OS

```
Apenas Gerente ou Admin podem criar OS.
Campos obrigatórios: ponto_id, tipo, titulo, atribuido_para
Campo reserva_id: opcional (OS pode existir sem reserva — ex: manutenção avulsa)

Tipo de OS × Quem pode ser atribuído:
  colagem_lona       → Funcionário
  manutencao_eletrica → Funcionário
  instalacao         → Funcionário
  remocao            → Funcionário
  pintura_empena     → Funcionário
  checkin_led        → Checkin (SOMENTE pontos LED)

Regra: OS do tipo checkin_led só pode ser criada para pontos do tipo 'led'.
Validação no backend: if (tipo === 'checkin_led' && ponto.tipo !== 'led') throw error
```

### 5.2 Status da OS — máquina de estados

```
criada → atribuida → em_execucao → aguardando_auditoria → aprovada
                                                         ↘ reprovada → em_execucao (retrabalho)
                                                                      ↘ aguardando_auditoria → aprovada

Transições permitidas:
  criada            → atribuida         (Gerente atribui)
  atribuida         → em_execucao       (Funcionário/Checkin inicia)
  em_execucao       → aguardando_auditoria (Funcionário/Checkin envia fotos e conclui)
  aguardando_auditoria → aprovada       (Mídia/Gerente aprova)
  aguardando_auditoria → reprovada      (Mídia/Gerente reprova com motivo)
  reprovada         → em_execucao       (Checkin/Funcionário refaz)
  aprovada          → finalizada        (Gerente finaliza — fecha OS)
```

### 5.3 Upload de fotos

```
Regras:
  - Mínimo de 1 foto para marcar OS como aguardando_auditoria
  - Fotos do Checkin DEVEM ter geolocalização (lat/lng obrigatórios)
  - Fotos do Funcionário: geolocalização opcional
  - Timestamp é sempre o momento do upload (ou captura offline se PWA)
  - Storage path: empresas/{empresa_id}/os/{os_id}/{uuid}.jpg

Offline (Checkin PWA):
  - Foto é salva em IndexedDB com metadados (lat, lng, os_id, capturado_em)
  - sync_pendente = true
  - Ao reconectar: BackgroundSync envia para /api/os/{os_id}/fotos
  - Após upload: sync_pendente = false, storage_path preenchido
```

### 5.4 Auditoria de fotos

```
Mídia vê fila de OS com status 'aguardando_auditoria'.

Ao aprovar OS:
  - Status de TODAS as fotos pendentes → 'aprovada'
  - OS status → 'aprovada'
  - Auditado_por = usuario.id, auditado_em = NOW()
  - Notificação para Gerente

Ao reprovar OS:
  - motivo_reprovacao OBRIGATÓRIO
  - Status das fotos com problema → 'reprovada'
  - OS status → 'reprovada'
  - Notificação para Checkin/Funcionário com motivo
  - Checkin pode refazer: tira novas fotos, submete novamente
```

---

## 6. Relatório de comprovação (PDF)

```
Disponível apenas para OS com status 'aprovada' ou 'finalizada'.
Gerado pelo Gerente ou Admin.

Conteúdo obrigatório do PDF:
  1. Cabeçalho: logo da empresa + nome da empresa
  2. Dados da campanha: cliente, nome da campanha, período
  3. Dados do ponto: código, nome, endereço, cidade
  4. Para cada foto aprovada:
     - Imagem
     - Data e hora (capturado_em, formatado em pt-BR)
     - Coordenadas GPS (lat, lng) + link Google Maps
     - Tipo: antes / durante / depois / checkin
  5. Rodapé: "Documento gerado em {data} pelo OOH Manager"

Apenas fotos com status 'aprovada' entram no PDF.
```

---

## 7. Consulta de disponibilidade

```
Tela acessível por todos os perfis (exceto Funcionário e Checkin).

Filtros disponíveis:
  - Tipo de ponto (outdoor/frontlight/empena/led)
  - Cidade
  - Período (data_inicio, data_fim)
  - Estado

Resultado por ponto:
  - LIVRE: nenhuma reserva ativa/solicitada no período (considerando tipo)
  - PARCIAL: LED com slots ainda disponíveis
  - OCUPADO: sem espaço no período

Para Outdoor: verifica bissemana — mostra disponibilidade por bissemana
Para LED: mostra X de Y slots ocupados
```

---

## 8. Visibilidade de dados por perfil

```
Admin:
  - Vê tudo da empresa

Gerente:
  - Vê tudo da empresa (exceto configurações financeiras do Admin)

Vendedor:
  - Clientes: apenas os próprios (vendedor_id = auth.uid())
  - Campanhas: apenas as dos próprios clientes
  - Reservas: apenas as próprias
  - OS: apenas o status geral das OS vinculadas às próprias campanhas
  - Não vê: clientes/campanhas/reservas de outros vendedores

Funcionário:
  - Vê APENAS as OS atribuídas a ele (atribuido_para = auth.uid())
  - Não vê pontos, reservas, clientes

Checkin:
  - Vê APENAS as OS de tipo checkin_led atribuídas a ele
  - Não vê pontos, reservas, clientes

Mídia:
  - Vê todas as OS com status aguardando_auditoria da empresa
  - Vê galeria de fotos das OS
  - Não pode criar/editar reservas ou pontos
```
