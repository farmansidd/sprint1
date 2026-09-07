"""Add assessment-enriched roadmap tables

Revision ID: assessment_phase1
Revises: 
Create Date: 2025-12-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'assessment_phase1'
down_revision = None  # Update this to your last migration ID
depends_on = None


def upgrade():
    # Create quiz_attempts table
    op.create_table(
        'quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('roadmap_id', sa.Integer(), nullable=True),
        sa.Column('quiz_id', sa.Integer(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('max_score', sa.Integer(), nullable=True),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('attempted_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ),
        sa.ForeignKeyConstraint(['roadmap_id'], ['roadmaps.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create micro_projects table
    op.create_table(
        'micro_projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('test_cases', sa.JSON(), nullable=True),
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create project_submissions table
    op.create_table(
        'project_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('roadmap_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('micro_project_id', sa.Integer(), nullable=True),
        sa.Column('submission_type', sa.String(), nullable=True),
        sa.Column('github_url', sa.String(), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['micro_project_id'], ['micro_projects.id'], ),
        sa.ForeignKeyConstraint(['roadmap_id'], ['roadmaps.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create auto_grading_results table
    op.create_table(
        'auto_grading_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('test_results', sa.JSON(), nullable=True),
        sa.Column('logs', sa.Text(), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('graded_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['project_submissions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('submission_id')
    )
    
    # Create topic_completions table
    op.create_table(
        'topic_completions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('roadmap_id', sa.Integer(), nullable=True),
        sa.Column('quiz_score', sa.Float(), nullable=True),
        sa.Column('project_score', sa.Float(), nullable=True),
        sa.Column('combined_score', sa.Float(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('attempts_count', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['roadmap_id'], ['roadmaps.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('topic_completions')
    op.drop_table('auto_grading_results')
    op.drop_table('project_submissions')
    op.drop_table('micro_projects')
    op.drop_table('quiz_attempts')
