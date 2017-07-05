library(dplyr)

fpath_file <- "exdata_2Fdata%2Fhousehold_power_consumption/household_power_consumption.txt"
df1<-read.csv(fpath_file, header=TRUE, sep=";", na.strings = "?")
df2<-subset(df1, Date %in% c("1/2/2007","2/2/2007"))
df2$Date<-as.Date(df2$Date, format="%d/%m/%Y")
df2<-cbind(df2, "DateTime"=as.POSIXct(paste(df2$Date, df2$Time)))

dev.new(width=480, height=480)
plot2<-with(df2, {
  plot(Global_active_power~df2$DateTime, type="l", ylab="Global Active Power (kilowatts)", xlab="")
})
dev.copy(png, "plot2.png")
dev.off()