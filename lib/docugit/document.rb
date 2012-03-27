class Document
  
  def self.start(file, filename, wiki_directory)
    File.open("#{wiki_directory}/#{filename}.md", "w+") do |f|
      file.read.scan(/(?<=\/\*\+)(.*?)(?=\+\*\/)/m) {|doc| f.write($~) }
    end
  end
    
end