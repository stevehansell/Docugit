class Documenter
  attr_reader :files_to_document, :markdown_destination, :markdown_file_names
  
  def initialize(files, markdown_destination)
    @files_to_document = files
    @markdown_destination = markdown_destination
    @markdown_file_names = []
  end
  
  def document
    @files_to_document.each do |file_to_document|
      document = Document.new(file_to_document)
      next unless document.compatible?
      puts "Reading #{document.file_name}"
      to_markdown(document) 
      @markdown_file_names << document.markdown_file_name
    end
  end
  
  def count_markdown_files
    @markdown_file_names.length
  end
  
  private
  
  def to_markdown(document)
    File.open(document.file) do |document_file|
      File.open("#{@markdown_destination}/#{document.markdown_file_name}", "w+") do |f|
        document_file.read.scan(document.search_pattern) {|doc| f.write($~) }
      end
    end
  end
    
end