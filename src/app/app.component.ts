import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type ViewMode = 'calendar' | 'board' | 'list' | 'inbox';
type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type Priority = 'Alta' | 'Media' | 'Baja';
type ThemeName = 'forest' | 'neon' | 'mint';

interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  glow: string;
  description: string;
}

interface CommentItem {
  id: number;
  author: string;
  text: string;
  createdAt: string;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  time: string;
  responsible: string;
  comments: CommentItem[];
  createdAt: string;
}

interface AppPreferences {
  theme: ThemeName;
  compact: boolean;
  particles: boolean;
  rounded: boolean;
}

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'warning';
}

interface CelebrationParticle {
  id: number;
  icon: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  readonly user = {
    name: 'Jacobo Ospina Gallo',
    initials: 'JO',
    email: 'jacobo.ospina@nativodigital.co',
    role: 'Administrador de tareas',
    status: 'Disponible'
  };

  readonly projects: Project[] = [
    {
      id: 'nativo',
      name: 'Nativo',
      icon: '🌿',
      color: '#7CFF3B',
      glow: 'rgba(124, 255, 59, .28)',
      description: 'Campañas, CRM, clientes, reportes y automatizaciones.'
    },
    {
      id: 'umanizales',
      name: 'Universidad de Manizales',
      icon: '🎓',
      color: '#65D6FF',
      glow: 'rgba(101, 214, 255, .25)',
      description: 'Clases, entregas académicas, parciales y trabajos.'
    },
    {
      id: 'freelance',
      name: 'Freelance',
      icon: '⚡',
      color: '#FFC857',
      glow: 'rgba(255, 200, 87, .25)',
      description: 'Proyectos externos, propuestas, clientes propios y entregables.'
    },
    {
      id: 'estudio',
      name: 'Estudio Empírico',
      icon: '🧪',
      color: '#FF6BD6',
      glow: 'rgba(255, 107, 214, .24)',
      description: 'Investigación, pruebas, aprendizaje autodidacta y documentación.'
    },
    {
      id: 'personal',
      name: 'Personal',
      icon: '🚀',
      color: '#B8FF5C',
      glow: 'rgba(184, 255, 92, .22)',
      description: 'Rutinas, pendientes personales, ideas y tareas rápidas.'
    }
  ];

  readonly days = [
    { label: 'LUN', date: '2026-05-11', day: 11 },
    { label: 'MAR', date: '2026-05-12', day: 12 },
    { label: 'MIÉ', date: '2026-05-13', day: 13 },
    { label: 'JUE', date: '2026-05-14', day: 14 },
    { label: 'VIE', date: '2026-05-15', day: 15 },
    { label: 'SÁB', date: '2026-05-16', day: 16 },
    { label: 'DOM', date: '2026-05-17', day: 17 }
  ];

  readonly boardColumns: Array<{ id: TaskStatus; label: string; helper: string }> = [
    { id: 'todo', label: 'Por hacer', helper: 'Tareas nuevas o pendientes.' },
    { id: 'doing', label: 'En progreso', helper: 'Lo que está avanzando.' },
    { id: 'review', label: 'En revisión', helper: 'Pendiente de validar.' },
    { id: 'done', label: 'Finalizadas', helper: 'Lo que ya quedó listo.' }
  ];

  tasks: TaskItem[] = [];
  activeView: ViewMode = 'calendar';
  selectedProject = 'all';
  searchTerm = '';
  selectedTask: TaskItem | null = null;
  commentDraft = '';
  showCreateModal = false;
  hideTopbar = false;
  showShareModal = false;
  showCustomizeModal = false;
  showUserMenu = false;
  showProfileModal = false;
  inviteEmail = '';
  collaborators = ['Laura CRM', 'Juanita Patiño'];
  copiedLink = false;
  toasts: ToastMessage[] = [];
  celebrationParticles: CelebrationParticle[] = [];

  preferences: AppPreferences = {
    theme: 'forest',
    compact: false,
    particles: true,
    rounded: true
  };

  newTask: Omit<TaskItem, 'id' | 'comments' | 'createdAt'> = this.getEmptyTask();

  ngOnInit(): void {
    this.loadState();
  }

  get filteredTasks(): TaskItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.tasks.filter((task) => {
      const project = this.getProject(task.projectId);
      const matchesProject = this.selectedProject === 'all' || task.projectId === this.selectedProject;
      const matchesSearch = !term ||
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        project.name.toLowerCase().includes(term) ||
        task.priority.toLowerCase().includes(term);

      return matchesProject && matchesSearch;
    });
  }

  get activeTasksCount(): number {
    return this.tasks.filter((task) => task.status !== 'done').length;
  }

  get doneTasksCount(): number {
    return this.tasks.filter((task) => task.status === 'done').length;
  }

  get highPriorityCount(): number {
    return this.tasks.filter((task) => task.priority === 'Alta' && task.status !== 'done').length;
  }

  get completionPercentage(): number {
    if (!this.tasks.length) {
      return 0;
    }

    return Math.round((this.doneTasksCount / this.tasks.length) * 100);
  }

  get greetingMessage(): string {
    const hour = new Date().getHours();
    const firstName = this.user.name.split(' ')[0] || 'Jacobo';

    if (hour >= 5 && hour < 12) {
      return `¡Buenos días, ${firstName}`;
    }

    if (hour >= 12 && hour < 18) {
      return `¡Buenas tardes, ${firstName}`;
    }

    return `¡Buenas noches, ${firstName}`;
  }

  get rootClasses(): Record<string, boolean> {
    return {
      'theme-forest': this.preferences.theme === 'forest',
      'theme-neon': this.preferences.theme === 'neon',
      'theme-mint': this.preferences.theme === 'mint',
      'is-compact': this.preferences.compact,
      'has-rounded-cards': this.preferences.rounded
    };
  }

  setView(view: ViewMode): void {
    this.activeView = view;
  }

  openCreateModal(projectId?: string, dueDate?: string): void {
    this.newTask = this.getEmptyTask();
    if (projectId) {
      this.newTask.projectId = projectId;
    } else if (this.selectedProject !== 'all') {
      this.newTask.projectId = this.selectedProject;
    }

    if (dueDate) {
      this.newTask.dueDate = dueDate;
    }

    this.showCreateModal = true;
  }

  createTask(): void {
    const title = this.newTask.title.trim();
    if (!title) {
      this.pushToast('Ponle un nombre a la tarea antes de crearla.', 'warning');
      return;
    }

    const task: TaskItem = {
      ...this.newTask,
      title,
      description: this.newTask.description.trim() || 'Sin descripción por ahora. Puedes editarla al abrir la tarea.',
      responsible: this.user.name,
      id: Date.now(),
      comments: [],
      createdAt: new Date().toISOString()
    };

    this.tasks = [task, ...this.tasks];
    this.showCreateModal = false;
    this.saveState();
    this.pushToast('Tarea creada y lista para trabajar.', 'success');
    this.selectedTask = task;
  }

  openTask(task: TaskItem): void {
    this.selectedTask = task;
    this.commentDraft = '';
  }

  closeTask(): void {
    this.selectedTask = null;
  }

  updateTask(): void {
    if (!this.selectedTask) {
      return;
    }

    const selectedTask = { ...this.selectedTask };
    this.tasks = this.tasks.map((task) => task.id === selectedTask.id ? selectedTask : task);
    this.saveState();
    this.pushToast('Cambios guardados.', 'success');
  }

  completeTask(task: TaskItem): void {
    const updatedTask = { ...task, status: 'done' as TaskStatus };
    this.tasks = this.tasks.map((item) => item.id === task.id ? updatedTask : item);
    if (this.selectedTask?.id === task.id) {
      this.selectedTask = updatedTask;
    }
    this.saveState();
    this.launchCelebration();
    this.pushToast('Tarea finalizada. GO WEED lo celebra contigo.', 'success');
  }

  reopenTask(task: TaskItem): void {
    const updatedTask = { ...task, status: 'todo' as TaskStatus };
    this.tasks = this.tasks.map((item) => item.id === task.id ? updatedTask : item);
    if (this.selectedTask?.id === task.id) {
      this.selectedTask = updatedTask;
    }
    this.saveState();
    this.pushToast('Tarea reabierta.', 'info');
  }

  moveTask(task: TaskItem, status: TaskStatus): void {
    const updatedTask = { ...task, status };
    this.tasks = this.tasks.map((item) => item.id === task.id ? updatedTask : item);
    if (this.selectedTask?.id === task.id) {
      this.selectedTask = updatedTask;
    }
    this.saveState();

    if (status === 'done') {
      this.launchCelebration();
      this.pushToast('Finalizada con estilo.', 'success');
    }
  }

  deleteTask(task: TaskItem): void {
    this.tasks = this.tasks.filter((item) => item.id !== task.id);
    if (this.selectedTask?.id === task.id) {
      this.selectedTask = null;
    }
    this.saveState();
    this.pushToast('Tarea eliminada.', 'info');
  }

  addComment(): void {
    if (!this.selectedTask) {
      return;
    }

    const text = this.commentDraft.trim();
    if (!text) {
      return;
    }

    const comment: CommentItem = {
      id: Date.now(),
      author: this.user.name,
      text,
      createdAt: new Date().toISOString()
    };

    this.selectedTask = {
      ...this.selectedTask,
      comments: [...this.selectedTask.comments, comment]
    };
    this.commentDraft = '';
    this.updateTask();
  }

  getTasksByDay(date: string): TaskItem[] {
    return this.filteredTasks.filter((task) => task.dueDate === date);
  }

  getTasksByStatus(status: TaskStatus): TaskItem[] {
    return this.filteredTasks.filter((task) => task.status === status);
  }

  getProject(projectId: string): Project {
    return this.projects.find((project) => project.id === projectId) ?? this.projects[0];
  }

  getProjectCount(projectId: string): number {
    return this.tasks.filter((task) => task.projectId === projectId && task.status !== 'done').length;
  }

  getPriorityClass(priority: Priority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  shareBoard(): void {
    this.showShareModal = true;
    this.copiedLink = false;
  }

  copyShareLink(): void {
    const link = 'https://go-weed.local/jacobo/board';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => undefined);
    }
    this.copiedLink = true;
    this.pushToast('Link del tablero copiado.', 'success');
  }

  addCollaborator(): void {
    const email = this.inviteEmail.trim();
    if (!email) {
      return;
    }

    this.collaborators = [...this.collaborators, email];
    this.inviteEmail = '';
    this.pushToast('Colaborador invitado al tablero.', 'success');
  }

  savePreferences(): void {
    this.saveState();
    this.showCustomizeModal = false;
    this.pushToast('Personalización aplicada.', 'success');
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  setUserStatus(status: string): void {
    this.user.status = status;
    this.showUserMenu = false;
    this.pushToast(`Estado cambiado a ${status}.`, 'success');
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    this.hideTopbar = scrollY > 60;
  }

  openProfile(): void {
    this.showProfileModal = true;
    this.showUserMenu = false;
  }

  fakeLogout(): void {
    this.showUserMenu = false;
    this.pushToast('Sesión protegida. Esta demo no cierra sesión real.', 'info');
  }

  launchCelebration(): void {
    if (!this.preferences.particles) {
      return;
    }

    const icons = ['🌿', '🍃', '🌱', '🚀', '✨', '💚', '🌸'];
    this.celebrationParticles = Array.from({ length: 42 }, (_, index) => ({
      id: Date.now() + index,
      icon: icons[index % icons.length],
      left: Math.round(Math.random() * 96),
      delay: Math.random() * 0.45,
      duration: 2.6 + Math.random() * 1.6,
      size: 18 + Math.round(Math.random() * 22)
    }));

    window.setTimeout(() => {
      this.celebrationParticles = [];
    }, 4600);
  }

  trackByTask(_: number, task: TaskItem): number {
    return task.id;
  }

  trackByProject(_: number, project: Project): string {
    return project.id;
  }

  trackByComment(_: number, comment: CommentItem): number {
    return comment.id;
  }

  private getEmptyTask(): Omit<TaskItem, 'id' | 'comments' | 'createdAt'> {
    return {
      title: '',
      description: '',
      projectId: 'nativo',
      status: 'todo',
      priority: 'Media',
      dueDate: '2026-05-12',
      time: '08:00',
      responsible: this.user?.name ?? 'Jacobo Ospina Gallo'
    };
  }

  private loadState(): void {
    const savedTasks = this.readStorage<TaskItem[]>('go-weed-tasks-v2');
    const savedPreferences = this.readStorage<AppPreferences>('go-weed-preferences-v2');

    this.tasks = savedTasks?.length ? savedTasks : this.getSeedTasks();
    this.preferences = savedPreferences ?? this.preferences;
  }

  private saveState(): void {
    if (!this.canUseStorage()) {
      return;
    }

    localStorage.setItem('go-weed-tasks-v2', JSON.stringify(this.tasks));
    localStorage.setItem('go-weed-preferences-v2', JSON.stringify(this.preferences));
  }

  private readStorage<T>(key: string): T | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private canUseStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private pushToast(text: string, type: ToastMessage['type']): void {
    const toast: ToastMessage = {
      id: Date.now(),
      text,
      type
    };

    this.toasts = [...this.toasts, toast];
    window.setTimeout(() => {
      this.toasts = this.toasts.filter((item) => item.id !== toast.id);
    }, 3200);
  }

  private getSeedTasks(): TaskItem[] {
    const baseComments: CommentItem[] = [
      {
        id: 1,
        author: 'Jacobo Ospina Gallo',
        text: 'Dejar avance claro y agregar contexto antes de finalizar.',
        createdAt: '2026-05-11T14:00:00.000Z'
      }
    ];

    return [
      {
        id: 101,
        title: 'Configurar tablero base de proyectos',
        description: 'Crear estructura inicial con proyectos, estados, prioridades y vistas para trabajar más rápido durante la semana.',
        projectId: 'nativo',
        status: 'doing',
        priority: 'Alta',
        dueDate: '2026-05-11',
        time: '08:00',
        responsible: this.user.name,
        comments: baseComments,
        createdAt: '2026-05-09T08:00:00.000Z'
      },
      {
        id: 102,
        title: 'Revisión de base de datos',
        description: 'Limpiar columnas, validar duplicados, clasificar contactos y dejar hallazgos accionables para el cliente.',
        projectId: 'nativo',
        status: 'review',
        priority: 'Alta',
        dueDate: '2026-05-15',
        time: '08:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-09T09:00:00.000Z'
      },
      {
        id: 103,
        title: 'Seguimiento de automatización CRM',
        description: 'Revisar si los triggers están moviendo oportunidades correctamente y documentar el paso a paso para soporte.',
        projectId: 'nativo',
        status: 'todo',
        priority: 'Media',
        dueDate: '2026-05-15',
        time: '13:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-10T08:00:00.000Z'
      },
      {
        id: 104,
        title: 'Entrega parcial de microeconomía',
        description: 'Preparar resumen de costos, ingresos y ejercicios para entregar con conclusiones claras.',
        projectId: 'umanizales',
        status: 'todo',
        priority: 'Alta',
        dueDate: '2026-05-13',
        time: '09:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-10T11:00:00.000Z'
      },
      {
        id: 105,
        title: 'Mapa conceptual de investigación',
        description: 'Organizar objetivos, hipótesis, variables y metodología para el proyecto académico.',
        projectId: 'umanizales',
        status: 'doing',
        priority: 'Media',
        dueDate: '2026-05-14',
        time: '11:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-10T13:20:00.000Z'
      },
      {
        id: 106,
        title: 'Propuesta landing para cliente freelance',
        description: 'Crear una estructura visual con hero, beneficios, prueba social, oferta y CTA hacia WhatsApp.',
        projectId: 'freelance',
        status: 'review',
        priority: 'Alta',
        dueDate: '2026-05-12',
        time: '10:30',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-11T07:45:00.000Z'
      },
      {
        id: 107,
        title: 'Cotización campaña Meta Ads',
        description: 'Definir alcance, entregables, piezas, copies, presupuesto sugerido y condiciones comerciales.',
        projectId: 'freelance',
        status: 'todo',
        priority: 'Media',
        dueDate: '2026-05-14',
        time: '16:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-11T08:30:00.000Z'
      },
      {
        id: 108,
        title: 'Documentar pruebas de prompts',
        description: 'Registrar qué prompts funcionaron mejor para tareas de análisis, copywriting y reporting.',
        projectId: 'estudio',
        status: 'doing',
        priority: 'Baja',
        dueDate: '2026-05-12',
        time: '14:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-11T10:30:00.000Z'
      },
      {
        id: 109,
        title: 'Investigar patrones de productividad',
        description: 'Analizar qué bloques de trabajo rinden mejor y convertirlos en una rutina semanal simple.',
        projectId: 'estudio',
        status: 'todo',
        priority: 'Media',
        dueDate: '2026-05-16',
        time: '15:30',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-11T12:15:00.000Z'
      },
      {
        id: 110,
        title: 'Organizar escritorio y archivos',
        description: 'Limpiar descargas, ordenar carpetas por cliente y dejar una estructura clara para trabajar sin perder tiempo.',
        projectId: 'personal',
        status: 'todo',
        priority: 'Baja',
        dueDate: '2026-05-17',
        time: '09:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-11T16:20:00.000Z'
      },
      {
        id: 111,
        title: 'Plan de entrenamiento semanal',
        description: 'Definir 3 bloques cortos de actividad física y recordatorios para cumplirlos.',
        projectId: 'personal',
        status: 'done',
        priority: 'Media',
        dueDate: '2026-05-11',
        time: '18:00',
        responsible: this.user.name,
        comments: [
          {
            id: 2,
            author: 'Jacobo Ospina Gallo',
            text: 'Quedó listo el plan base. Falta repetirlo cada semana.',
            createdAt: '2026-05-11T22:00:00.000Z'
          }
        ],
        createdAt: '2026-05-11T17:00:00.000Z'
      },
      {
        id: 112,
        title: 'Revisión final de entregables Nativo',
        description: 'Validar ortografía, formato, conclusiones y claridad antes de enviar al grupo.',
        projectId: 'nativo',
        status: 'todo',
        priority: 'Alta',
        dueDate: '2026-05-12',
        time: '16:00',
        responsible: this.user.name,
        comments: [],
        createdAt: '2026-05-11T18:00:00.000Z'
      }
    ];
  }
}
