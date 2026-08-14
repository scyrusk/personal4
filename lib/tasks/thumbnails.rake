# SF-18: responsive thumbnail variants. Cards display thumbnails in fixed 64px and
# 96px boxes, so a 96w (1x) and 192w (2x) candidate cover every DPR without ever
# shipping the full-size upload to the list view. Variants sit next to the original
# (resp96_<name> / resp192_<name>) and Paper#thumbnail_srcset only advertises the
# ones that exist, so a missed run degrades to the original file, never a 404.
namespace :thumbs do
  desc "Generate 96w/192w PNG variants beside each paper thumbnail (uses sips)"
  task responsive: :environment do
    generated = 0
    skipped = 0
    Paper.find_each do |paper|
      src = paper.thumbnail.present? ? paper.thumbnail.path : nil
      next if src.blank? || !File.exist?(src)

      dir = File.dirname(src)
      base = File.basename(src)
      { 96 => "resp96_#{base}", 192 => "resp192_#{base}" }.each do |width, name|
        out = File.join(dir, name)
        if File.exist?(out) && File.mtime(out) >= File.mtime(src)
          skipped += 1
          next
        end
        ok = system("sips", "--resampleWidth", width.to_s, src, "--out", out,
                    out: File::NULL, err: File::NULL)
        generated += 1 if ok
      end
    end
    puts "thumbs:responsive — generated #{generated}, up-to-date #{skipped}"
  end
end
