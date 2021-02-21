# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20210221194356) do

  create_table "authors", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "authors_papers", id: false, force: :cascade do |t|
    t.integer "paper_id",  null: false
    t.integer "author_id", null: false
  end

  add_index "authors_papers", ["author_id", "paper_id"], name: "index_authors_papers_on_author_id_and_paper_id"
  add_index "authors_papers", ["paper_id", "author_id"], name: "index_authors_papers_on_paper_id_and_author_id"

  create_table "awards", force: :cascade do |t|
    t.integer  "year"
    t.text     "body"
    t.integer  "paper_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean  "pinned"
  end

  add_index "awards", ["paper_id"], name: "index_awards_on_paper_id"

  create_table "paper_author_links", force: :cascade do |t|
    t.integer  "paper_id"
    t.integer  "author_id"
    t.integer  "author_order"
    t.datetime "created_at",   null: false
    t.datetime "updated_at",   null: false
  end

  create_table "papers", force: :cascade do |t|
    t.integer  "self_order"
    t.integer  "year"
    t.text     "venue"
    t.integer  "downloads"
    t.integer  "likes"
    t.datetime "created_at",       null: false
    t.datetime "updated_at",       null: false
    t.string   "title"
    t.integer  "backing_type"
    t.string   "pdf"
    t.string   "thumbnail"
    t.text     "summary"
    t.string   "slides"
    t.string   "html_slides_url"
    t.string   "html_paper_url"
    t.string   "presentation_url"
    t.string   "video_url"
    t.text     "tags"
    t.string   "tweets"
  end

  create_table "travels", force: :cascade do |t|
    t.datetime "date"
    t.string   "location"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string   "title"
    t.string   "link"
  end

  create_table "updates", force: :cascade do |t|
    t.datetime "date"
    t.text     "text"
    t.integer  "backing_type"
    t.datetime "created_at",   null: false
    t.datetime "updated_at",   null: false
  end

end
