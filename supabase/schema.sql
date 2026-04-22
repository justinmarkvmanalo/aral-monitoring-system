create table if not exists admins (
    id integer generated always as identity primary key,
    name varchar(120) not null,
    initials varchar(5) not null,
    email varchar(120) not null unique,
    password varchar(255) not null,
    is_active boolean not null default true,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp
);

create table if not exists teachers (
    id integer generated always as identity primary key,
    full_name varchar(100) not null,
    initials char(3) not null,
    email varchar(150) not null unique,
    password_hash varchar(255) not null,
    created_at timestamptz not null default current_timestamp
);

create table if not exists school_years (
    id integer generated always as identity primary key,
    label varchar(20) not null unique,
    start_date date not null,
    end_date date not null
);

create table if not exists sections (
    id integer generated always as identity primary key,
    school_year_id integer not null references school_years(id) on delete restrict,
    grade_level smallint not null check (grade_level between 1 and 6),
    section_name varchar(50) not null,
    teacher_id integer not null references teachers(id) on delete restrict,
    created_at timestamptz not null default current_timestamp
);

create table if not exists students (
    id integer generated always as identity primary key,
    section_id integer not null references sections(id) on delete restrict,
    last_name varchar(60) not null,
    first_name varchar(60) not null,
    middle_name varchar(60),
    initials char(3) not null,
    lrn char(12) unique,
    gender varchar(10) check (gender in ('M', 'F', 'Other')),
    birth_date date,
    is_active boolean not null default true,
    enrolled_at date,
    created_at timestamptz not null default current_timestamp
);

create table if not exists announcements (
    id integer generated always as identity primary key,
    admin_id integer not null references admins(id) on delete cascade,
    title varchar(180) not null,
    message text not null,
    created_at timestamptz not null default current_timestamp
);

create table if not exists attendance (
    id integer generated always as identity primary key,
    student_id integer not null references students(id) on delete cascade,
    session_date date not null,
    status varchar(1) not null check (status in ('P', 'A', 'L')),
    recorded_by integer not null references teachers(id) on delete restrict,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    unique (student_id, session_date)
);

create table if not exists interventions (
    id integer generated always as identity primary key,
    student_id integer not null references students(id) on delete cascade,
    priority varchar(10) not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
    concern_area varchar(20) not null check (concern_area in ('Reading', 'Numeracy', 'Science', 'Attendance', 'General')),
    notes text not null,
    status varchar(20) not null default 'Open' check (status in ('Open', 'In Progress', 'Resolved')),
    recorded_by integer not null references teachers(id) on delete restrict,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp
);

create table if not exists numeracy_skills (
    id integer generated always as identity primary key,
    skill_name varchar(80) not null unique
);

create table if not exists numeracy_drills (
    id integer generated always as identity primary key,
    teacher_id integer not null references teachers(id) on delete cascade,
    section_id integer not null default 0,
    skill varchar(50) not null,
    skill_name varchar(100) not null,
    level smallint not null default 1,
    total_items integer not null default 10,
    label varchar(255) not null,
    questions jsonb,
    saved boolean not null default false,
    created_at timestamptz not null default current_timestamp
);

create table if not exists numeracy_quizzes (
    id integer generated always as identity primary key,
    section_id integer not null references sections(id) on delete cascade,
    skill_id integer not null references numeracy_skills(id) on delete restrict,
    quiz_date date not null,
    total_items smallint not null default 5,
    created_by integer not null references teachers(id) on delete restrict,
    created_at timestamptz not null default current_timestamp
);

create table if not exists numeracy_scores (
    id integer generated always as identity primary key,
    quiz_id integer not null references numeracy_quizzes(id) on delete cascade,
    student_id integer not null references students(id) on delete cascade,
    raw_score smallint not null,
    pct_score smallint not null,
    mastery varchar(20) not null check (mastery in ('Mastered', 'Developing', 'Below Mastery')),
    recorded_at timestamptz not null default current_timestamp,
    unique (quiz_id, student_id)
);

create table if not exists reading_levels (
    id integer generated always as identity primary key,
    student_id integer not null references students(id) on delete cascade,
    assessed_date date not null,
    level varchar(20) not null check (level in ('Independent', 'Instructional', 'Frustration')),
    comprehension_pct smallint not null check (comprehension_pct between 0 and 100),
    pronunciation varchar(20) not null check (pronunciation in ('Proficient', 'Developing', 'Needs Support')),
    notes text,
    recorded_by integer not null references teachers(id) on delete restrict,
    created_at timestamptz not null default current_timestamp
);

create table if not exists science_topics (
    id integer generated always as identity primary key,
    topic_name varchar(120) not null,
    description text
);

create table if not exists science_quizzes (
    id integer generated always as identity primary key,
    section_id integer not null references sections(id) on delete cascade,
    topic_id integer not null references science_topics(id) on delete restrict,
    quiz_date date not null,
    total_items smallint not null default 3,
    created_by integer not null references teachers(id) on delete restrict,
    created_at timestamptz not null default current_timestamp
);

create table if not exists science_scores (
    id integer generated always as identity primary key,
    quiz_id integer not null references science_quizzes(id) on delete cascade,
    student_id integer not null references students(id) on delete cascade,
    raw_score smallint not null,
    pct_score smallint not null,
    recorded_at timestamptz not null default current_timestamp,
    unique (quiz_id, student_id)
);

create index if not exists idx_sections_teacher_id on sections (teacher_id);
create index if not exists idx_students_section_id on students (section_id);
create index if not exists idx_attendance_session_date on attendance (session_date);
create index if not exists idx_attendance_recorded_by on attendance (recorded_by);
create index if not exists idx_numeracy_drills_teacher_id on numeracy_drills (teacher_id);
create index if not exists idx_numeracy_quizzes_section_id on numeracy_quizzes (section_id);
create index if not exists idx_numeracy_scores_student_id on numeracy_scores (student_id);
create index if not exists idx_reading_levels_student_id on reading_levels (student_id);
create index if not exists idx_science_quizzes_section_id on science_quizzes (section_id);
create index if not exists idx_science_scores_student_id on science_scores (student_id);

insert into numeracy_skills (skill_name)
values ('Addition'), ('Division'), ('Multiplication'), ('Subtraction')
on conflict (skill_name) do nothing;
