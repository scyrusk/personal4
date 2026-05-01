# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_04_24_165000) do
  create_table "authors", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "authors_papers", id: false, force: :cascade do |t|
    t.integer "paper_id", null: false
    t.integer "author_id", null: false
    t.index ["author_id", "paper_id"], name: "index_authors_papers_on_author_id_and_paper_id"
    t.index ["paper_id", "author_id"], name: "index_authors_papers_on_paper_id_and_author_id"
  end

  create_table "awards", force: :cascade do |t|
    t.integer "year"
    t.text "body"
    t.integer "paper_id"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "pinned"
    t.index ["paper_id"], name: "index_awards_on_paper_id"
  end

  create_table "paper_author_links", force: :cascade do |t|
    t.integer "paper_id"
    t.integer "author_id"
    t.integer "author_order"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "papers", force: :cascade do |t|
    t.integer "self_order"
    t.integer "year"
    t.text "venue"
    t.integer "downloads"
    t.integer "likes"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "title"
    t.integer "backing_type"
    t.string "pdf"
    t.string "thumbnail"
    t.text "summary"
    t.string "slides"
    t.string "html_slides_url"
    t.string "html_paper_url"
    t.string "presentation_url"
    t.string "video_url"
    t.text "tags"
    t.string "tweets"
    t.string "project_page_url"
    t.string "doi"
    t.text "bibtex"
  end

  create_table "travels", force: :cascade do |t|
    t.datetime "date", precision: nil
    t.string "location"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.string "title"
    t.string "link"
  end

  create_table "updates", force: :cascade do |t|
    t.datetime "date", precision: nil
    t.text "text"
    t.integer "backing_type"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
  end

  add_foreign_key "awards", "papers"
end
