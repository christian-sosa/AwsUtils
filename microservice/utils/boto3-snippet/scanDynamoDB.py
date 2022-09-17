For AND '&' is used and for OR '|' is used


response = table.scan(
              Select= 'ALL_ATTRIBUTES',
              FilterExpression=Attr('CustomerName').begins_with("S") | Attr('CustomerName').begins_with("S") 
              )

response_table = table.scan(
        FilterExpression=Attr("date").contains(now) & Attr("file_name").contains(status)
    )